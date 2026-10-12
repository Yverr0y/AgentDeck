#!/usr/bin/env python3
"""Read fresh device_info; callers must first release daemon serial ownership.

Each port runs in a child with a wall-clock budget. A wedged USB driver must not
hold up every subsequent board. In particular, PySerial's write_timeout does not
bound flush()/tcdrain(), so a request is written without a drain.
"""
import glob
import json
import platform
import re
import subprocess
import sys
import time


def read_port(port):
    import serial

    with serial.Serial(port, baudrate=115200, timeout=0.2, write_timeout=0.5) as ser:
        ser.reset_input_buffer()
        ser.write(b'{"type":"device_info_request"}\n')
        deadline = time.monotonic() + 1.5
        pending = b''
        while time.monotonic() < deadline:
            raw = ser.read_until(b'\n', size=65536)
            pending += raw
            if len(pending) > 65536:
                return None
            if not raw.endswith(b'\n'):
                continue
            try:
                obj = json.loads(pending)
            except (ValueError, UnicodeDecodeError):
                pending = b''
                continue
            pending = b''
            if not isinstance(obj, dict) or obj.get('type') != 'device_info':
                continue
            board = obj.get('board')
            if isinstance(board, str) and re.fullmatch(r'[A-Za-z0-9_-]+', board):
                return board
    return None


def probe_port(port, timeout=3):
    child = subprocess.Popen(
        [sys.executable, __file__, '--probe-port', port],
        stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True,
    )
    try:
        output, _ = child.communicate(timeout=timeout)
    except subprocess.TimeoutExpired:
        child.kill()
        try:
            child.communicate(timeout=0.5)
        except subprocess.TimeoutExpired:
            # Even teardown has a bound if the driver is stuck in kernel I/O.
            child.stdout.close()
            child.stderr.close()
        print(f'No fresh identity from {port}: serial probe timed out', file=sys.stderr)
        return None
    board = output.strip()
    if child.returncode == 0 and re.fullmatch(r'[A-Za-z0-9_-]+', board):
        return board
    return None


def discover_ports():
    patterns = ['/dev/cu.usbserial-*', '/dev/cu.wchusbserial*', '/dev/cu.usbmodem*'] \
        if platform.system() == 'Darwin' else ['/dev/ttyUSB*', '/dev/ttyACM*']
    return sorted({port for pattern in patterns for port in glob.glob(pattern)})


if __name__ == '__main__':
    if len(sys.argv) == 3 and sys.argv[1] == '--probe-port':
        try:
            identity = read_port(sys.argv[2])
            if identity:
                print(identity)
        except Exception:
            sys.exit(1)
    else:
        for candidate in sys.argv[1:] or discover_ports():
            identity = probe_port(candidate)
            if identity:
                print(f'{identity} {candidate}')
