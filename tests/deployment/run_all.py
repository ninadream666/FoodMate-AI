"""
FoodMate-AI 云端部署测试 — 一键运行全部测试
用法: python run_all.py
"""

import sys
import os
import time
import subprocess

# 确保 config.py 可以被导入
os.chdir(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ".")

TESTS = [
    ("01 功能验证", "test_01_functional.py"),
    ("02 安全测试", "test_02_security.py"),
    ("03 性能测试与数据流量分析", "test_03_performance.py"),
]

DIVIDER = "=" * 60


def main():
    print(DIVIDER)
    print("  FoodMate-AI 云端部署测试")
    print(f"  目标服务器: http://8.217.223.120")
    print(f"  执行时间: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    print(DIVIDER)

    total_passed = 0
    total_failed = 0
    results = []

    for name, filename in TESTS:
        print(f"\n{'─' * 50}")
        print(f"  运行: {name} ({filename})")
        print(f"{'─' * 50}")

        result = subprocess.run(
            [sys.executable, "-m", "pytest", filename, "-v", "-s", "--tb=short"],
            capture_output=False,
        )

        passed = result.returncode == 0
        results.append((name, passed))
        if passed:
            total_passed += 1
        else:
            total_failed += 1

    # 汇总
    print(f"\n\n{DIVIDER}")
    print("  测试汇总")
    print(DIVIDER)
    for name, passed in results:
        status = "PASS" if passed else "FAIL"
        print(f"  [{status}] {name}")

    print(f"\n  通过: {total_passed}/{len(TESTS)}")
    print(f"  失败: {total_failed}/{len(TESTS)}")
    print(DIVIDER)

    return 0 if total_failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
