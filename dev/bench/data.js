window.BENCHMARK_DATA = {
  "lastUpdate": 1772296293831,
  "repoUrl": "https://github.com/stulyproject/anode",
  "entries": {
    "Benchmark": [
      {
        "commit": {
          "author": {
            "email": "delphin.blehoussi93@gmail.com",
            "name": "luxluth",
            "username": "luxluth"
          },
          "committer": {
            "email": "delphin.blehoussi93@gmail.com",
            "name": "luxluth",
            "username": "luxluth"
          },
          "distinct": true,
          "id": "a1a8425e9f6cc0e923a1ddaaf6973d1c4d965b8f",
          "message": "ci(workflow): updated benchmark action",
          "timestamp": "2026-02-28T17:30:40+01:00",
          "tree_id": "dd90e52e0469d2d327cec65ce3ee3899cfb684de",
          "url": "https://github.com/stulyproject/anode/commit/a1a8425e9f6cc0e923a1ddaaf6973d1c4d965b8f"
        },
        "date": 1772296293172,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Create 1000 entities with 2 sockets",
            "value": 1.2020443289549423,
            "range": "0.25%",
            "unit": "ops/sec",
            "extra": "Samples: 10\nMin: 827.9160 ms\nMax: 837.4645 ms\np99: 837.4645 ms\nMean: 831.9161 ms"
          },
          {
            "name": "Link 1000 entities sequentially",
            "value": 235.28505858583833,
            "range": "7.14%",
            "unit": "ops/sec",
            "extra": "Samples: 118\nMin: 3.5309 ms\nMax: 19.5650 ms\np99: 9.7193 ms\nMean: 4.2502 ms"
          },
          {
            "name": "Query 2000 nodes (10% viewport)",
            "value": 1264558.9504146485,
            "range": "0.38%",
            "unit": "ops/sec",
            "extra": "Samples: 632280\nMin: 0.0007 ms\nMax: 0.5393 ms\np99: 0.0012 ms\nMean: 0.0008 ms"
          },
          {
            "name": "Move 1000 nodes (Incremental QuadTree updates)",
            "value": 1115.5275361604658,
            "range": "22.22%",
            "unit": "ops/sec",
            "extra": "Samples: 558\nMin: 0.7344 ms\nMax: 57.4478 ms\np99: 1.3339 ms\nMean: 0.8964 ms"
          },
          {
            "name": "Direct value propagation (1 link)",
            "value": 6122446.934703139,
            "range": "0.55%",
            "unit": "ops/sec",
            "extra": "Samples: 3061224\nMin: 0.0001 ms\nMax: 0.4199 ms\np99: 0.0003 ms\nMean: 0.0002 ms"
          },
          {
            "name": "Chain propagation (100 links deep)",
            "value": 8363.624991782544,
            "range": "0.13%",
            "unit": "ops/sec",
            "extra": "Samples: 4182\nMin: 0.1137 ms\nMax: 0.1890 ms\np99: 0.1386 ms\nMean: 0.1196 ms"
          },
          {
            "name": "Serialize 1000 nodes to JSON",
            "value": 6105.613783293584,
            "range": "5.31%",
            "unit": "ops/sec",
            "extra": "Samples: 3053\nMin: 0.0652 ms\nMax: 7.7744 ms\np99: 0.6330 ms\nMean: 0.1638 ms"
          },
          {
            "name": "Deserialize 1000 nodes from JSON",
            "value": 775.2919646133017,
            "range": "0.81%",
            "unit": "ops/sec",
            "extra": "Samples: 388\nMin: 1.2206 ms\nMax: 2.1567 ms\np99: 2.0107 ms\nMean: 1.2898 ms"
          },
          {
            "name": "Apply 500 atomic actions",
            "value": 1022.7397432695973,
            "range": "1.04%",
            "unit": "ops/sec",
            "extra": "Samples: 512\nMin: 0.9023 ms\nMax: 1.8347 ms\np99: 1.4700 ms\nMean: 0.9778 ms"
          },
          {
            "name": "Resolve world position (50 levels deep)",
            "value": 1278207.1921767895,
            "range": "0.08%",
            "unit": "ops/sec",
            "extra": "Samples: 639104\nMin: 0.0008 ms\nMax: 0.0414 ms\np99: 0.0008 ms\nMean: 0.0008 ms"
          }
        ]
      }
    ]
  }
}