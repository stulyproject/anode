window.BENCHMARK_DATA = {
  "lastUpdate": 1772309827209,
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
      },
      {
        "commit": {
          "author": {
            "name": "luxluth",
            "username": "luxluth",
            "email": "delphin.blehoussi93@gmail.com"
          },
          "committer": {
            "name": "luxluth",
            "username": "luxluth",
            "email": "delphin.blehoussi93@gmail.com"
          },
          "id": "a1a8425e9f6cc0e923a1ddaaf6973d1c4d965b8f",
          "message": "ci(workflow): updated benchmark action",
          "timestamp": "2026-02-28T16:30:40Z",
          "url": "https://github.com/stulyproject/anode/commit/a1a8425e9f6cc0e923a1ddaaf6973d1c4d965b8f"
        },
        "date": 1772296324207,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Create 1000 entities with 2 sockets",
            "value": 1.2170889997180567,
            "range": "0.32%",
            "unit": "ops/sec",
            "extra": "Samples: 10\nMin: 817.4809 ms\nMax: 828.3760 ms\np99: 828.3760 ms\nMean: 821.6326 ms"
          },
          {
            "name": "Link 1000 entities sequentially",
            "value": 238.84067453105774,
            "range": "7.13%",
            "unit": "ops/sec",
            "extra": "Samples: 120\nMin: 3.5144 ms\nMax: 19.7078 ms\np99: 9.6287 ms\nMean: 4.1869 ms"
          },
          {
            "name": "Query 2000 nodes (10% viewport)",
            "value": 1662270.8663355662,
            "range": "0.38%",
            "unit": "ops/sec",
            "extra": "Samples: 831136\nMin: 0.0006 ms\nMax: 0.6176 ms\np99: 0.0009 ms\nMean: 0.0006 ms"
          },
          {
            "name": "Move 1000 nodes (Incremental QuadTree updates)",
            "value": 1177.3101598211201,
            "range": "5.12%",
            "unit": "ops/sec",
            "extra": "Samples: 589\nMin: 0.7309 ms\nMax: 12.0980 ms\np99: 1.3900 ms\nMean: 0.8494 ms"
          },
          {
            "name": "Direct value propagation (1 link)",
            "value": 6004307.687731377,
            "range": "0.49%",
            "unit": "ops/sec",
            "extra": "Samples: 3002154\nMin: 0.0001 ms\nMax: 0.3582 ms\np99: 0.0003 ms\nMean: 0.0002 ms"
          },
          {
            "name": "Chain propagation (100 links deep)",
            "value": 8517.861158861102,
            "range": "0.25%",
            "unit": "ops/sec",
            "extra": "Samples: 4259\nMin: 0.1129 ms\nMax: 0.7012 ms\np99: 0.1350 ms\nMean: 0.1174 ms"
          },
          {
            "name": "Serialize 1000 nodes to JSON",
            "value": 6503.86734712121,
            "range": "5.41%",
            "unit": "ops/sec",
            "extra": "Samples: 3252\nMin: 0.0647 ms\nMax: 7.1755 ms\np99: 0.6488 ms\nMean: 0.1538 ms"
          },
          {
            "name": "Deserialize 1000 nodes from JSON",
            "value": 779.8228148985772,
            "range": "0.95%",
            "unit": "ops/sec",
            "extra": "Samples: 390\nMin: 1.2196 ms\nMax: 2.3737 ms\np99: 2.0818 ms\nMean: 1.2823 ms"
          },
          {
            "name": "Apply 500 atomic actions",
            "value": 1052.8836001438028,
            "range": "0.57%",
            "unit": "ops/sec",
            "extra": "Samples: 527\nMin: 0.8959 ms\nMax: 1.8719 ms\np99: 1.0076 ms\nMean: 0.9498 ms"
          },
          {
            "name": "Resolve world position (50 levels deep)",
            "value": 1280195.3650219338,
            "range": "0.06%",
            "unit": "ops/sec",
            "extra": "Samples: 640098\nMin: 0.0008 ms\nMax: 0.0397 ms\np99: 0.0008 ms\nMean: 0.0008 ms"
          }
        ]
      },
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
          "id": "28de19b6089276f8674525548435b2db8984d799",
          "message": "Update README.md",
          "timestamp": "2026-02-28T18:50:03+01:00",
          "tree_id": "a68fc519c5fb2bfdc852bf3a36628de8bc73a383",
          "url": "https://github.com/stulyproject/anode/commit/28de19b6089276f8674525548435b2db8984d799"
        },
        "date": 1772301052463,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Create 1000 entities with 2 sockets",
            "value": 1.2648399617316852,
            "range": "0.50%",
            "unit": "ops/sec",
            "extra": "Samples: 10\nMin: 784.5650 ms\nMax: 800.2211 ms\np99: 800.2211 ms\nMean: 790.6139 ms"
          },
          {
            "name": "Link 1000 entities sequentially",
            "value": 243.51572855016326,
            "range": "4.60%",
            "unit": "ops/sec",
            "extra": "Samples: 122\nMin: 3.3006 ms\nMax: 14.2113 ms\np99: 8.0548 ms\nMean: 4.1065 ms"
          },
          {
            "name": "Query 2000 nodes (10% viewport)",
            "value": 1528815.5107789377,
            "range": "0.33%",
            "unit": "ops/sec",
            "extra": "Samples: 764408\nMin: 0.0006 ms\nMax: 0.7014 ms\np99: 0.0009 ms\nMean: 0.0007 ms"
          },
          {
            "name": "Move 1000 nodes (Incremental QuadTree updates)",
            "value": 1028.7118367508886,
            "range": "22.25%",
            "unit": "ops/sec",
            "extra": "Samples: 515\nMin: 0.8170 ms\nMax: 57.6462 ms\np99: 1.3460 ms\nMean: 0.9721 ms"
          },
          {
            "name": "Direct value propagation (1 link)",
            "value": 5727062.957657646,
            "range": "0.48%",
            "unit": "ops/sec",
            "extra": "Samples: 2863532\nMin: 0.0001 ms\nMax: 0.3487 ms\np99: 0.0003 ms\nMean: 0.0002 ms"
          },
          {
            "name": "Chain propagation (100 links deep)",
            "value": 8023.833072176826,
            "range": "0.24%",
            "unit": "ops/sec",
            "extra": "Samples: 4012\nMin: 0.1199 ms\nMax: 0.2571 ms\np99: 0.1571 ms\nMean: 0.1246 ms"
          },
          {
            "name": "Serialize 1000 nodes to JSON",
            "value": 4945.776945459853,
            "range": "4.37%",
            "unit": "ops/sec",
            "extra": "Samples: 2473\nMin: 0.0642 ms\nMax: 7.1676 ms\np99: 0.6390 ms\nMean: 0.2022 ms"
          },
          {
            "name": "Deserialize 1000 nodes from JSON",
            "value": 819.2935919562929,
            "range": "0.98%",
            "unit": "ops/sec",
            "extra": "Samples: 410\nMin: 1.1725 ms\nMax: 2.7170 ms\np99: 1.7907 ms\nMean: 1.2206 ms"
          },
          {
            "name": "Apply 500 atomic actions",
            "value": 1118.5865719050605,
            "range": "0.60%",
            "unit": "ops/sec",
            "extra": "Samples: 560\nMin: 0.8655 ms\nMax: 1.6865 ms\np99: 1.1063 ms\nMean: 0.8940 ms"
          },
          {
            "name": "Resolve world position (50 levels deep)",
            "value": 1332977.5547868977,
            "range": "0.08%",
            "unit": "ops/sec",
            "extra": "Samples: 666489\nMin: 0.0007 ms\nMax: 0.0306 ms\np99: 0.0008 ms\nMean: 0.0008 ms"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "name": "luxluth",
            "username": "luxluth",
            "email": "delphin.blehoussi93@gmail.com"
          },
          "committer": {
            "name": "luxluth",
            "username": "luxluth",
            "email": "delphin.blehoussi93@gmail.com"
          },
          "id": "28de19b6089276f8674525548435b2db8984d799",
          "message": "Update README.md",
          "timestamp": "2026-02-28T17:50:03Z",
          "url": "https://github.com/stulyproject/anode/commit/28de19b6089276f8674525548435b2db8984d799"
        },
        "date": 1772301084337,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Create 1000 entities with 2 sockets",
            "value": 1.243309525008184,
            "range": "0.91%",
            "unit": "ops/sec",
            "extra": "Samples: 10\nMin: 794.8843 ms\nMax: 827.9952 ms\np99: 827.9952 ms\nMean: 804.3049 ms"
          },
          {
            "name": "Link 1000 entities sequentially",
            "value": 250.0458551354162,
            "range": "4.10%",
            "unit": "ops/sec",
            "extra": "Samples: 126\nMin: 3.2694 ms\nMax: 13.2966 ms\np99: 6.0770 ms\nMean: 3.9993 ms"
          },
          {
            "name": "Query 2000 nodes (10% viewport)",
            "value": 1448708.1079820273,
            "range": "0.11%",
            "unit": "ops/sec",
            "extra": "Samples: 724355\nMin: 0.0006 ms\nMax: 0.1025 ms\np99: 0.0013 ms\nMean: 0.0007 ms"
          },
          {
            "name": "Move 1000 nodes (Incremental QuadTree updates)",
            "value": 1118.8156083711333,
            "range": "0.71%",
            "unit": "ops/sec",
            "extra": "Samples: 560\nMin: 0.8401 ms\nMax: 2.2003 ms\np99: 0.9793 ms\nMean: 0.8938 ms"
          },
          {
            "name": "Direct value propagation (1 link)",
            "value": 5661493.354642307,
            "range": "0.10%",
            "unit": "ops/sec",
            "extra": "Samples: 2830747\nMin: 0.0001 ms\nMax: 0.0279 ms\np99: 0.0003 ms\nMean: 0.0002 ms"
          },
          {
            "name": "Chain propagation (100 links deep)",
            "value": 8171.792305727795,
            "range": "0.13%",
            "unit": "ops/sec",
            "extra": "Samples: 4086\nMin: 0.1199 ms\nMax: 0.2228 ms\np99: 0.1485 ms\nMean: 0.1224 ms"
          },
          {
            "name": "Serialize 1000 nodes to JSON",
            "value": 4799.517475710617,
            "range": "5.28%",
            "unit": "ops/sec",
            "extra": "Samples: 2400\nMin: 0.0608 ms\nMax: 7.8184 ms\np99: 0.6484 ms\nMean: 0.2084 ms"
          },
          {
            "name": "Deserialize 1000 nodes from JSON",
            "value": 829.7463614726068,
            "range": "0.67%",
            "unit": "ops/sec",
            "extra": "Samples: 415\nMin: 1.1776 ms\nMax: 1.8679 ms\np99: 1.7621 ms\nMean: 1.2052 ms"
          },
          {
            "name": "Apply 500 atomic actions",
            "value": 1114.6916084308275,
            "range": "0.37%",
            "unit": "ops/sec",
            "extra": "Samples: 558\nMin: 0.8655 ms\nMax: 1.3338 ms\np99: 1.0728 ms\nMean: 0.8971 ms"
          },
          {
            "name": "Resolve world position (50 levels deep)",
            "value": 1342697.8979556775,
            "range": "0.08%",
            "unit": "ops/sec",
            "extra": "Samples: 671349\nMin: 0.0007 ms\nMax: 0.0306 ms\np99: 0.0008 ms\nMean: 0.0007 ms"
          }
        ]
      },
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
          "id": "2d7f5dcf57178944a9df8f1156ad30c59c400743",
          "message": "Update README",
          "timestamp": "2026-02-28T20:59:29+01:00",
          "tree_id": "70336de03bcd51a6c3b0cc8db4736e10a6874846",
          "url": "https://github.com/stulyproject/anode/commit/2d7f5dcf57178944a9df8f1156ad30c59c400743"
        },
        "date": 1772308820200,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Create 1000 entities with 2 sockets",
            "value": 1.2457374933425076,
            "range": "0.72%",
            "unit": "ops/sec",
            "extra": "Samples: 10\nMin: 795.5014 ms\nMax: 824.0985 ms\np99: 824.0985 ms\nMean: 802.7373 ms"
          },
          {
            "name": "Link 1000 entities sequentially",
            "value": 243.84526554828517,
            "range": "5.44%",
            "unit": "ops/sec",
            "extra": "Samples: 122\nMin: 3.2951 ms\nMax: 16.8821 ms\np99: 7.7764 ms\nMean: 4.1010 ms"
          },
          {
            "name": "Query 2000 nodes (10% viewport)",
            "value": 1226190.5751658017,
            "range": "0.28%",
            "unit": "ops/sec",
            "extra": "Samples: 613096\nMin: 0.0007 ms\nMax: 0.4393 ms\np99: 0.0013 ms\nMean: 0.0008 ms"
          },
          {
            "name": "Move 1000 nodes (Incremental QuadTree updates)",
            "value": 1108.297685787025,
            "range": "3.64%",
            "unit": "ops/sec",
            "extra": "Samples: 555\nMin: 0.8004 ms\nMax: 9.5210 ms\np99: 1.3464 ms\nMean: 0.9023 ms"
          },
          {
            "name": "Direct value propagation (1 link)",
            "value": 5564319.788589096,
            "range": "0.10%",
            "unit": "ops/sec",
            "extra": "Samples: 2782160\nMin: 0.0001 ms\nMax: 0.0339 ms\np99: 0.0003 ms\nMean: 0.0002 ms"
          },
          {
            "name": "Chain propagation (100 links deep)",
            "value": 8171.2793095081925,
            "range": "0.10%",
            "unit": "ops/sec",
            "extra": "Samples: 4086\nMin: 0.1203 ms\nMax: 0.1933 ms\np99: 0.1388 ms\nMean: 0.1224 ms"
          },
          {
            "name": "Serialize 1000 nodes to JSON",
            "value": 5079.5928538073085,
            "range": "4.68%",
            "unit": "ops/sec",
            "extra": "Samples: 2542\nMin: 0.0615 ms\nMax: 8.0505 ms\np99: 0.6414 ms\nMean: 0.1969 ms"
          },
          {
            "name": "Deserialize 1000 nodes from JSON",
            "value": 821.2148315722466,
            "range": "0.86%",
            "unit": "ops/sec",
            "extra": "Samples: 411\nMin: 1.1771 ms\nMax: 2.5752 ms\np99: 1.7763 ms\nMean: 1.2177 ms"
          },
          {
            "name": "Apply 500 atomic actions",
            "value": 1110.521147860918,
            "range": "0.58%",
            "unit": "ops/sec",
            "extra": "Samples: 556\nMin: 0.8708 ms\nMax: 1.6776 ms\np99: 1.1362 ms\nMean: 0.9005 ms"
          },
          {
            "name": "Resolve world position (50 levels deep)",
            "value": 1333685.8106161822,
            "range": "0.10%",
            "unit": "ops/sec",
            "extra": "Samples: 666843\nMin: 0.0007 ms\nMax: 0.0401 ms\np99: 0.0008 ms\nMean: 0.0007 ms"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "name": "luxluth",
            "username": "luxluth",
            "email": "delphin.blehoussi93@gmail.com"
          },
          "committer": {
            "name": "luxluth",
            "username": "luxluth",
            "email": "delphin.blehoussi93@gmail.com"
          },
          "id": "2d7f5dcf57178944a9df8f1156ad30c59c400743",
          "message": "Update README",
          "timestamp": "2026-02-28T19:59:29Z",
          "url": "https://github.com/stulyproject/anode/commit/2d7f5dcf57178944a9df8f1156ad30c59c400743"
        },
        "date": 1772308849625,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Create 1000 entities with 2 sockets",
            "value": 1.267725809745758,
            "range": "0.20%",
            "unit": "ops/sec",
            "extra": "Samples: 10\nMin: 785.3574 ms\nMax: 792.9276 ms\np99: 792.9276 ms\nMean: 788.8141 ms"
          },
          {
            "name": "Link 1000 entities sequentially",
            "value": 245.58617550613323,
            "range": "4.69%",
            "unit": "ops/sec",
            "extra": "Samples: 123\nMin: 3.2595 ms\nMax: 13.5030 ms\np99: 8.2058 ms\nMean: 4.0719 ms"
          },
          {
            "name": "Query 2000 nodes (10% viewport)",
            "value": 1499183.6581847449,
            "range": "0.29%",
            "unit": "ops/sec",
            "extra": "Samples: 749592\nMin: 0.0006 ms\nMax: 0.4135 ms\np99: 0.0010 ms\nMean: 0.0007 ms"
          },
          {
            "name": "Move 1000 nodes (Incremental QuadTree updates)",
            "value": 1119.808463481292,
            "range": "3.69%",
            "unit": "ops/sec",
            "extra": "Samples: 560\nMin: 0.7869 ms\nMax: 9.6630 ms\np99: 1.3048 ms\nMean: 0.8930 ms"
          },
          {
            "name": "Direct value propagation (1 link)",
            "value": 5869642.227381284,
            "range": "0.38%",
            "unit": "ops/sec",
            "extra": "Samples: 2934822\nMin: 0.0001 ms\nMax: 0.5203 ms\np99: 0.0003 ms\nMean: 0.0002 ms"
          },
          {
            "name": "Chain propagation (100 links deep)",
            "value": 8138.100795141809,
            "range": "0.24%",
            "unit": "ops/sec",
            "extra": "Samples: 4070\nMin: 0.1202 ms\nMax: 0.4703 ms\np99: 0.1402 ms\nMean: 0.1229 ms"
          },
          {
            "name": "Serialize 1000 nodes to JSON",
            "value": 6428.432867220087,
            "range": "21.22%",
            "unit": "ops/sec",
            "extra": "Samples: 3223\nMin: 0.0600 ms\nMax: 53.5279 ms\np99: 0.5992 ms\nMean: 0.1556 ms"
          },
          {
            "name": "Deserialize 1000 nodes from JSON",
            "value": 835.288277587886,
            "range": "0.80%",
            "unit": "ops/sec",
            "extra": "Samples: 418\nMin: 1.1660 ms\nMax: 1.9731 ms\np99: 1.8598 ms\nMean: 1.1972 ms"
          },
          {
            "name": "Apply 500 atomic actions",
            "value": 1110.446937796384,
            "range": "0.60%",
            "unit": "ops/sec",
            "extra": "Samples: 556\nMin: 0.8704 ms\nMax: 1.6823 ms\np99: 1.0481 ms\nMean: 0.9005 ms"
          },
          {
            "name": "Resolve world position (50 levels deep)",
            "value": 1341878.9882219825,
            "range": "0.09%",
            "unit": "ops/sec",
            "extra": "Samples: 670940\nMin: 0.0007 ms\nMax: 0.0356 ms\np99: 0.0008 ms\nMean: 0.0007 ms"
          }
        ]
      },
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
          "id": "93d5104bed5103495b64d92df1ef4dd4ca25915c",
          "message": "chore: Removing most technical stuff that no one cares about anyway",
          "timestamp": "2026-02-28T21:15:42+01:00",
          "tree_id": "8df9af9fe4f5a02d8140a2d68581a543bb1ae586",
          "url": "https://github.com/stulyproject/anode/commit/93d5104bed5103495b64d92df1ef4dd4ca25915c"
        },
        "date": 1772309797276,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Create 1000 entities with 2 sockets",
            "value": 1.0570877998875967,
            "range": "0.14%",
            "unit": "ops/sec",
            "extra": "Samples: 10\nMin: 944.4156 ms\nMax: 950.1587 ms\np99: 950.1587 ms\nMean: 945.9952 ms"
          },
          {
            "name": "Link 1000 entities sequentially",
            "value": 254.44540119226244,
            "range": "1.40%",
            "unit": "ops/sec",
            "extra": "Samples: 128\nMin: 3.3059 ms\nMax: 6.4586 ms\np99: 5.1713 ms\nMean: 3.9301 ms"
          },
          {
            "name": "Query 2000 nodes (10% viewport)",
            "value": 1688659.8547774397,
            "range": "0.89%",
            "unit": "ops/sec",
            "extra": "Samples: 844330\nMin: 0.0005 ms\nMax: 2.0234 ms\np99: 0.0011 ms\nMean: 0.0006 ms"
          },
          {
            "name": "Move 1000 nodes (Incremental QuadTree updates)",
            "value": 1191.1691214203388,
            "range": "0.67%",
            "unit": "ops/sec",
            "extra": "Samples: 596\nMin: 0.7830 ms\nMax: 2.0131 ms\np99: 0.9979 ms\nMean: 0.8395 ms"
          },
          {
            "name": "Direct value propagation (1 link)",
            "value": 5627629.268385222,
            "range": "0.22%",
            "unit": "ops/sec",
            "extra": "Samples: 2813815\nMin: 0.0001 ms\nMax: 0.5009 ms\np99: 0.0003 ms\nMean: 0.0002 ms"
          },
          {
            "name": "Chain propagation (100 links deep)",
            "value": 8079.480731772407,
            "range": "0.21%",
            "unit": "ops/sec",
            "extra": "Samples: 4040\nMin: 0.1210 ms\nMax: 0.2547 ms\np99: 0.1474 ms\nMean: 0.1238 ms"
          },
          {
            "name": "Serialize 1000 nodes to JSON",
            "value": 4819.050781930338,
            "range": "5.37%",
            "unit": "ops/sec",
            "extra": "Samples: 2410\nMin: 0.0607 ms\nMax: 8.5371 ms\np99: 0.6505 ms\nMean: 0.2075 ms"
          },
          {
            "name": "Deserialize 1000 nodes from JSON",
            "value": 764.8419970930854,
            "range": "2.24%",
            "unit": "ops/sec",
            "extra": "Samples: 383\nMin: 1.1741 ms\nMax: 2.6831 ms\np99: 2.4369 ms\nMean: 1.3075 ms"
          },
          {
            "name": "Apply 500 atomic actions",
            "value": 1088.2733216059557,
            "range": "1.07%",
            "unit": "ops/sec",
            "extra": "Samples: 545\nMin: 0.8667 ms\nMax: 1.5879 ms\np99: 1.5662 ms\nMean: 0.9189 ms"
          },
          {
            "name": "Resolve world position (50 levels deep)",
            "value": 1335150.958582133,
            "range": "0.09%",
            "unit": "ops/sec",
            "extra": "Samples: 667576\nMin: 0.0007 ms\nMax: 0.0392 ms\np99: 0.0008 ms\nMean: 0.0007 ms"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "name": "luxluth",
            "username": "luxluth",
            "email": "delphin.blehoussi93@gmail.com"
          },
          "committer": {
            "name": "luxluth",
            "username": "luxluth",
            "email": "delphin.blehoussi93@gmail.com"
          },
          "id": "93d5104bed5103495b64d92df1ef4dd4ca25915c",
          "message": "chore: Removing most technical stuff that no one cares about anyway",
          "timestamp": "2026-02-28T20:15:42Z",
          "url": "https://github.com/stulyproject/anode/commit/93d5104bed5103495b64d92df1ef4dd4ca25915c"
        },
        "date": 1772309826359,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Create 1000 entities with 2 sockets",
            "value": 1.2581947919068888,
            "range": "0.33%",
            "unit": "ops/sec",
            "extra": "Samples: 10\nMin: 790.5054 ms\nMax: 804.2784 ms\np99: 804.2784 ms\nMean: 794.7895 ms"
          },
          {
            "name": "Link 1000 entities sequentially",
            "value": 243.53084416052764,
            "range": "5.34%",
            "unit": "ops/sec",
            "extra": "Samples: 122\nMin: 3.2966 ms\nMax: 16.7469 ms\np99: 7.6455 ms\nMean: 4.1063 ms"
          },
          {
            "name": "Query 2000 nodes (10% viewport)",
            "value": 1442730.6409451347,
            "range": "3.12%",
            "unit": "ops/sec",
            "extra": "Samples: 721366\nMin: 0.0006 ms\nMax: 4.6838 ms\np99: 0.0013 ms\nMean: 0.0007 ms"
          },
          {
            "name": "Move 1000 nodes (Incremental QuadTree updates)",
            "value": 1195.9910635548022,
            "range": "0.82%",
            "unit": "ops/sec",
            "extra": "Samples: 598\nMin: 0.7860 ms\nMax: 2.0145 ms\np99: 1.1570 ms\nMean: 0.8361 ms"
          },
          {
            "name": "Direct value propagation (1 link)",
            "value": 5624086.616499104,
            "range": "0.49%",
            "unit": "ops/sec",
            "extra": "Samples: 2812044\nMin: 0.0001 ms\nMax: 0.3793 ms\np99: 0.0003 ms\nMean: 0.0002 ms"
          },
          {
            "name": "Chain propagation (100 links deep)",
            "value": 8033.78064565615,
            "range": "0.23%",
            "unit": "ops/sec",
            "extra": "Samples: 4017\nMin: 0.1210 ms\nMax: 0.5647 ms\np99: 0.1495 ms\nMean: 0.1245 ms"
          },
          {
            "name": "Serialize 1000 nodes to JSON",
            "value": 5249.718604584006,
            "range": "5.70%",
            "unit": "ops/sec",
            "extra": "Samples: 2625\nMin: 0.0599 ms\nMax: 9.4203 ms\np99: 0.6578 ms\nMean: 0.1905 ms"
          },
          {
            "name": "Deserialize 1000 nodes from JSON",
            "value": 833.8241898372737,
            "range": "0.71%",
            "unit": "ops/sec",
            "extra": "Samples: 417\nMin: 1.1682 ms\nMax: 1.8854 ms\np99: 1.7865 ms\nMean: 1.1993 ms"
          },
          {
            "name": "Apply 500 atomic actions",
            "value": 1105.1833402432198,
            "range": "1.04%",
            "unit": "ops/sec",
            "extra": "Samples: 553\nMin: 0.8650 ms\nMax: 2.7924 ms\np99: 1.2502 ms\nMean: 0.9048 ms"
          },
          {
            "name": "Resolve world position (50 levels deep)",
            "value": 1271911.4734295267,
            "range": "0.41%",
            "unit": "ops/sec",
            "extra": "Samples: 635956\nMin: 0.0007 ms\nMax: 0.1097 ms\np99: 0.0008 ms\nMean: 0.0008 ms"
          }
        ]
      }
    ]
  }
}