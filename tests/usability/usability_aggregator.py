# -*- coding: utf-8 -*-
"""
可用性测试结果汇总脚本

将 data_U001.json ~ data_U00N.json 汇总，生成：
- result_usability.md   汇总报告（Markdown 表格）
- aggregate.json        汇总数据

使用方法：
    python tests/usability/usability_aggregator.py
"""
import glob
import json
import os
import statistics
from datetime import datetime

HERE = os.path.dirname(os.path.abspath(__file__))


def main():
    files = sorted(glob.glob(os.path.join(HERE, "data_U*.json")))
    if not files:
        print("⚠️ 未找到任何 data_U*.json，先运行 usability_data_collector.py 采集数据")
        return

    records = []
    for fp in files:
        with open(fp, "r", encoding="utf-8") as f:
            records.append(json.load(f))

    n = len(records)
    print(f"读取到 {n} 名被试数据")

    # 按任务汇总
    task_stats = {}
    for tid, _ in [(t["id"], t["name"]) for t in records[0]["tasks"]]:
        durations = [t["duration_sec"] for r in records for t in r["tasks"] if t["id"] == tid]
        completes = [t["status"] for r in records for t in r["tasks"] if t["id"] == tid]
        errors = [t["errors"] for r in records for t in r["tasks"] if t["id"] == tid]
        helps = [t["helps"] for r in records for t in r["tasks"] if t["id"] == tid]
        task_stats[tid] = {
            "name": next(t["name"] for r in records for t in r["tasks"] if t["id"] == tid),
            "n": len(durations),
            "complete_rate": completes.count("complete") / len(completes) if completes else 0,
            "mean_duration": round(statistics.mean(durations), 1) if durations else 0,
            "median_duration": round(statistics.median(durations), 1) if durations else 0,
            "mean_errors": round(statistics.mean(errors), 2) if errors else 0,
            "mean_helps": round(statistics.mean(helps), 2) if helps else 0,
        }

    # SUS 汇总
    sus_scores = [r["sus_score"] for r in records]
    sus_mean = statistics.mean(sus_scores)
    sus_std = statistics.stdev(sus_scores) if len(sus_scores) > 1 else 0
    nps_scores = [r.get("nps", 0) for r in records]
    nps_mean = statistics.mean(nps_scores)

    aggregate = {
        "timestamp": datetime.now().isoformat(),
        "sample_size": n,
        "task_stats": task_stats,
        "sus_mean": round(sus_mean, 2),
        "sus_std": round(sus_std, 2),
        "sus_min": min(sus_scores),
        "sus_max": max(sus_scores),
        "nps_mean": round(nps_mean, 2),
        "feedbacks": [
            {"user": r["user_id"], "pros": r.get("feedback_pros", ""), "cons": r.get("feedback_cons", "")}
            for r in records
        ],
    }

    # 写 JSON
    with open(os.path.join(HERE, "aggregate.json"), "w", encoding="utf-8") as f:
        json.dump(aggregate, f, ensure_ascii=False, indent=2)

    # 写 Markdown
    md = []
    md.append(f"# 可用性测试汇总报告\n")
    md.append(f"- 采样时间: {aggregate['timestamp']}")
    md.append(f"- 被试数: {n}")
    md.append(f"- SUS 平均分: **{aggregate['sus_mean']:.1f}** (σ={aggregate['sus_std']:.1f}, 范围 {aggregate['sus_min']}–{aggregate['sus_max']})")
    md.append(f"- NPS 均值: {aggregate['nps_mean']:.1f}")
    md.append("")
    md.append("## 任务级数据\n")
    md.append("| 任务 | n | 完成率 | 平均用时(s) | 中位数 | 平均错误 | 平均求助 |")
    md.append("|------|---|--------|------------|--------|----------|----------|")
    for tid, s in task_stats.items():
        md.append(f"| T{tid} {s['name']} | {s['n']} | {s['complete_rate']:.0%} | {s['mean_duration']} | {s['median_duration']} | {s['mean_errors']} | {s['mean_helps']} |")

    md.append("\n## 用户反馈\n")
    for fb in aggregate["feedbacks"]:
        md.append(f"- **{fb['user']}**：✅ {fb['pros']} ｜ ❌ {fb['cons']}")

    with open(os.path.join(HERE, "result_usability.md"), "w", encoding="utf-8") as f:
        f.write("\n".join(md))

    print(f"✅ 已生成: {HERE}/aggregate.json")
    print(f"✅ 已生成: {HERE}/result_usability.md")


if __name__ == "__main__":
    main()
