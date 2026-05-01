# -*- coding: utf-8 -*-
"""
可用性测试数据采集脚本

使用方法：
    python tests/usability/usability_data_collector.py --user-id U001

主试人员在被试操作过程中：
- 按 Enter 标记任务开始
- 任务完成时输入 c (complete) / f (fail) / h (helped)，并填写错误次数
- 全部任务完成后录入 SUS 10 题分数（1-5）
- 自动计算 SUS 总分，输出到 result_usability.json

数据格式：
    {
      "user_id": "U001",
      "tasks": [{"id": 1, "name": "注册", "duration_sec": 35.4, "status": "complete", "errors": 0, "helps": 0}, ...],
      "sus_raw": [4, 2, 5, 1, 4, 1, 5, 1, 4, 2],
      "sus_score": 87.5,
      "nps": 9,
      "feedback_pros": "推荐很准",
      "feedback_cons": "个人中心入口不明显"
    }
"""
import argparse
import json
import os
import sys
import time
from datetime import datetime

TASKS = [
    (1, "注册账号"),
    (2, "登录并填写基本健康信息"),
    (3, "浏览推荐餐厅，找到 4.5+ 评分餐厅"),
    (4, "基于关键词查找川菜餐厅"),
    (5, "查看 AI 推荐理由"),
    (6, "拍照识别食物 (NutriVision)"),
    (7, "下单到结算页（不付款）"),
]


def time_task(task_id: int, task_name: str) -> dict:
    """计时单个任务"""
    print(f"\n--- Task {task_id}: {task_name} ---")
    input("[Enter 开始计时]")
    start = time.time()
    while True:
        ans = input("结束时输入: c=完成 / f=失败 / h=求助后完成 / r=重置> ").strip().lower()
        if ans in ("c", "f", "h"):
            break
        elif ans == "r":
            start = time.time()
            print("已重置计时")
    duration = time.time() - start
    errors = input("错误次数（点错按钮、回退等）> ").strip() or "0"
    helps = input("求助次数> ").strip() or "0"
    notes = input("备注（按 Enter 跳过）> ").strip()
    status_map = {"c": "complete", "f": "fail", "h": "helped"}
    return {
        "id": task_id,
        "name": task_name,
        "duration_sec": round(duration, 2),
        "status": status_map[ans],
        "errors": int(errors),
        "helps": int(helps),
        "notes": notes,
    }


def collect_sus() -> tuple:
    """采集 SUS 10 题原始分，计算总分"""
    print("\n=== SUS 问卷（1-5）===")
    questions = [
        "Q1 我愿意经常使用这个 App",
        "Q2 我觉得这个 App 不必要地复杂",
        "Q3 我觉得这个 App 用起来很容易",
        "Q4 我需要技术人员的帮助才能使用",
        "Q5 我觉得 App 的各个功能整合得很好",
        "Q6 我觉得 App 中存在过多前后不一致的地方",
        "Q7 我相信大多数人能很快学会这个 App",
        "Q8 我觉得这个 App 用起来很笨拙",
        "Q9 我使用这个 App 时感觉很有信心",
        "Q10 我需要先学习很多东西才能使用这个 App",
    ]
    raw = []
    for i, q in enumerate(questions, 1):
        while True:
            try:
                v = int(input(f"{q}\n  分数 (1-5)> "))
                if 1 <= v <= 5:
                    raw.append(v)
                    break
            except ValueError:
                pass
            print("  请输入 1-5 的整数")
    # SUS 计分：奇数题 score-1，偶数题 5-score，求和 ×2.5
    transformed = []
    for idx, score in enumerate(raw):
        if (idx + 1) % 2 == 1:  # 奇数题
            transformed.append(score - 1)
        else:
            transformed.append(5 - score)
    sus_score = sum(transformed) * 2.5
    return raw, sus_score


def grade_sus(score: float) -> str:
    if score >= 91: return "A 卓越"
    if score >= 81: return "B 优秀"
    if score >= 68: return "C 良好（≥行业均值）"
    if score >= 51: return "D 较差"
    return "F 不可接受"


def main():
    parser = argparse.ArgumentParser(description="可用性测试数据采集")
    parser.add_argument("--user-id", required=True, help="被试编号 (U001/U002...)")
    parser.add_argument("--out-dir", default=None, help="输出目录")
    args = parser.parse_args()

    out_dir = args.out_dir or os.path.dirname(os.path.abspath(__file__))
    os.makedirs(out_dir, exist_ok=True)

    record = {
        "user_id": args.user_id,
        "timestamp": datetime.now().isoformat(),
        "tasks": [],
    }

    print(f"\n========== FoodMate-AI 可用性测试 — 被试 {args.user_id} ==========")
    print("提示：按任务卡上的顺序引导被试，主试不主动提示，仅观察记录。")

    for task_id, task_name in TASKS:
        record["tasks"].append(time_task(task_id, task_name))

    raw, score = collect_sus()
    record["sus_raw"] = raw
    record["sus_score"] = score
    record["sus_grade"] = grade_sus(score)

    # NPS
    while True:
        try:
            nps = int(input("\nNPS（0-10，是否会推荐给朋友）> "))
            if 0 <= nps <= 10:
                record["nps"] = nps
                break
        except ValueError:
            pass

    record["feedback_pros"] = input("被试反馈 — 最满意的一点> ").strip()
    record["feedback_cons"] = input("被试反馈 — 最大的痛点> ").strip()

    # 保存
    out_file = os.path.join(out_dir, f"data_{args.user_id}.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(record, f, ensure_ascii=False, indent=2)

    print(f"\n✅ 数据已保存: {out_file}")
    print(f"📊 SUS 总分: {score:.1f} — {record['sus_grade']}")
    print(f"📊 任务完成率: {sum(1 for t in record['tasks'] if t['status']=='complete')}/{len(TASKS)}")


if __name__ == "__main__":
    sys.exit(main())
