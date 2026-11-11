"""Deterministic analytics. Never delegate arithmetic to an LLM."""
from collections import Counter, defaultdict
from datetime import date, datetime
import math
import re
import statistics

def safe_value(value):
    if value is None: return None
    if isinstance(value, (datetime, date)): return value.isoformat()
    if isinstance(value, bool): return value
    if isinstance(value, (int, float)):
        return value if math.isfinite(value) else None
    text = str(value).strip()
    return text[:1000] if text else None

def numeric(value):
    if isinstance(value, bool) or value is None: return None
    if isinstance(value, (int, float)):
        return float(value) if math.isfinite(value) else None
    if isinstance(value, str):
        val = value.strip().replace(",", "").replace("٪", "%").replace("٫", ".")
        val = val.translate(str.maketrans("۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩", "01234567890123456789"))
        if re.fullmatch(r"-?\d+(\.\d+)?%?", val):
            try: return float(val.rstrip("%"))
            except ValueError: return None
    return None

def profile(rows, columns):
    details = []
    for col in columns:
        values = [r.get(col) for r in rows]
        available = [v for v in values if v is not None and v != ""]
        nums = [numeric(v) for v in available]
        valid_numbers = [x for x in nums if x is not None]
        is_num = len(available) > 0 and len(valid_numbers)/len(available) >= .85
        result = {"name": col, "kind": "numeric" if is_num else "categorical",
                  "missing": len(values)-len(available), "unique": len({str(v) for v in available})}
        if is_num:
            result.update({"sum": round(sum(valid_numbers), 2),
                           "avg": round(statistics.mean(valid_numbers), 2),
                           "min": round(min(valid_numbers), 2),
                           "max": round(max(valid_numbers), 2)})
        else:
            counts = Counter(str(v)[:60] for v in available)
            result["top"] = [{"name": k, "count": v} for k, v in counts.most_common(5)]
        details.append(result)
    return details

def aggregate(rows, columns, group, metric=None, operation="count", limit=24):
    if group not in columns: raise ValueError("Unknown grouping column")
    if metric is not None and metric not in columns: raise ValueError("Unknown metric column")
    if operation not in ("count", "sum", "avg"): raise ValueError("Unknown aggregation")
    if operation != "count" and not metric: raise ValueError("Metric required")
    groups = defaultdict(list)
    for row in rows:
        key = str(row.get(group) or "نامشخص")[:90]
        if operation == "count":
            groups[key].append(1)
        else:
            val = numeric(row.get(metric))
            if val is not None: groups[key].append(val)
    output = []
    for key, values in groups.items():
        if not values: continue
        number = len(values) if operation == "count" else sum(values) if operation == "sum" else statistics.mean(values)
        output.append({"name": key, "value": round(number, 2)})
    output.sort(key=lambda p: -p["value"])
    return output[:limit]

def suggestions(rows, columns):
    stats = profile(rows, columns)
    notes = []
    if not rows: return ["این شیت داده‌ای برای تحلیل ندارد."]
    for col in stats:
        if col["missing"] > 0:
            notes.append(f'ستون «{col["name"]}» دارای {col["missing"]} مقدار خالی از {len(rows)} ردیف است.')
        if col["kind"] == "numeric" and col["max"] != col["min"]:
            notes.append(f'میانگین «{col["name"]}» برابر {col["avg"]} و بازه داده‌ها از {col["min"]} تا {col["max"]} است.')
        if col["kind"] == "categorical" and col.get("top"):
            top = col["top"][0]
            notes.append(f'بیشترین فراوانی در «{col["name"]}» مربوط به «{top["name"]}» با {top["count"]} رکورد است.')
    return notes[:10] or ["برای تحلیل دقیق‌تر، ستون‌های سنجه و دوره زمانی را مشخص کنید."]
