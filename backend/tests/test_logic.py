from app.logic import aggregate, profile, numeric, suggestions, recommend_charts

def test_persian_numeric():
    assert numeric("۱۲۳٫۵") == 123.5
    assert numeric("1,250") == 1250
    assert numeric("hello") is None

def test_aggregate():
    rows = [{"team":"A","score":10},{"team":"A","score":20},{"team":"B","score":30}]
    assert aggregate(rows, ["team","score"], "team", "score", "avg")[0] == {"name":"B","value":30}
    assert aggregate(rows, ["team","score"], "team")[0]["value"] == 2

def test_profile_and_notes():
    rows = [{"team":"A","score":10},{"team":"B","score":None}]
    stats = profile(rows, ["team","score"])
    assert stats[1]["missing"] == 1
    assert suggestions(rows, ["team","score"])

def test_recommended_charts():
    stats = profile([{"Team":"A", "Score": 12},{"Team":"B", "Score": 28}], ["Team", "Score"])
    recs = recommend_charts(stats)
    assert recs
    assert any(r["operation"] == "avg" and r["metric"] == "Score" for r in recs)
