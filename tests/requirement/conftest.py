# -*- coding: utf-8 -*-
def pytest_configure(config):
    config.addinivalue_line(
        "markers", "req_critical: 标记必须在每次发布前通过的核心需求回归用例"
    )
