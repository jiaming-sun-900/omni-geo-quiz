# World Airport Quiz (V) 机场清单 + Hint体系

只做Satellite版本，共60座机场，六大洲覆盖，不含美国机场（已有US Airport Quiz覆盖）。

## Hint体系（四级）

1. Continent — region字段，6大洲（Africa / Asia / Europe / North America / South America / Oceania）
2. Country — country字段
3. City — city字段（机场所服务的城市，非机场全名）
4. IATA Code — iata字段，直接从数据取，无需手写冷知识

## Zoom档位定义

- 紧凑跑道型（单组跑道、小型机场） zoom约14
- 标准枢纽型（双跑道或三跑道干线机场） zoom约13
- 大型复合型（多跑道、超大占地、人工岛） zoom约12

## 数据Schema

`{ name, iata, city, country, region, lat, lng, imageFile }`

imageFile命名规范：`IATA.jpg`，例如 `HKG.jpg`，IATA码全球唯一，无需额外后缀消歧。

---

## 亚洲 (23)

| 机场全名 | IATA | 城市 | 国家 | 截图建议 | Zoom档位 | 备注 |
|---|---|---|---|---|---|---|
| Beijing Capital International | PEK | Beijing | China | 三条跑道平行排列+T3航站楼大型指廊 | 标准枢纽型 | |
| Beijing Daxing International | PKX | Beijing | China | 六芒星/海星形航站楼俯视，辨识度极高 | 大型复合型 | 必选 |
| Shanghai Pudong International | PVG | Shanghai | China | 两条平行跑道+弧形海岸边缘 | 标准枢纽型 | |
| Shanghai Hongqiao International | SHA | Shanghai | China | 城市内嵌机场，跑道紧贴市区 | 紧凑跑道型 | |
| Hong Kong International | HKG | Hong Kong | China | 大屿山人工填海岛，双跑道，三面环海 | 大型复合型 | 必选 |
| Tokyo Haneda | HND | Tokyo | Japan | 东京湾人工填海，扇形航站楼群 | 大型复合型 | |
| Tokyo Narita | NRT | Tokyo | Japan | 两条错位跑道，大型货运区 | 标准枢纽型 | |
| New Chitose | CTS | Sapporo | Japan | 平行双跑道夹航站楼，周围雪原/丘陵 | 标准枢纽型 | |
| Kansai International | KIX | Osaka | Japan | 人工岛，完美椭圆轮廓，双跑道 | 大型复合型 | 必选 |
| Itami | ITM | Osaka | Japan | 城市机场，X形跑道，周围密集住宅 | 紧凑跑道型 | |
| Incheon International | ICN | Seoul | South Korea | 岛上机场，海湾环绕，多跑道 | 大型复合型 | 必选 |
| Singapore Changi | SIN | Singapore | Singapore | 三航站楼+Jewel圆形建筑，跑道夹海岸 | 大型复合型 | 必选 |
| Suvarnabhumi | BKK | Bangkok | Thailand | X形双跑道，超大候机楼 | 大型复合型 | |
| Kuala Lumpur International | KUL | Kuala Lumpur | Malaysia | Y形航站楼+卫星楼，热带丛林包围 | 大型复合型 | |
| Tan Son Nhat International | SGN | Ho Chi Minh City | Vietnam | 双跑道，城市边缘，军民两用遗留格局 | 标准枢纽型 | |
| Ninoy Aquino International | MNL | Manila | Philippines | 多航站楼紧凑排列，马尼拉湾近岸 | 标准枢纽型 | |
| Soekarno-Hatta International | CGK | Jakarta | Indonesia | 双圆形航站楼（T1/T2），平行跑道 | 大型复合型 | |
| Ngurah Rai International | DPS | Bali | Indonesia | 跑道紧贴海岸线，南侧直面印度洋 | 紧凑跑道型 | 必选 |
| Dubai International | DXB | Dubai | UAE | 超长平行三跑道，巨型货运区 | 大型复合型 | 必选 |
| Abu Dhabi International | AUH | Abu Dhabi | UAE | 新航站楼（midfield terminal）巨型结构 | 大型复合型 | 阿提哈德主基地 |
| Hamad International | DOH | Doha | Qatar | 单跑道延伸入海湾，候机楼弧形 | 标准枢纽型 | |
| Istanbul Airport | IST | Istanbul | Turkey | 超大单体航站楼，六跑道规划中 | 大型复合型 | |
| Indira Gandhi International | DEL | Delhi | India | 三角形三跑道布局 | 大型复合型 | |

## 欧洲 (15)

| 机场全名 | IATA | 城市 | 国家 | 截图建议 | Zoom档位 | 备注 |
|---|---|---|---|---|---|---|
| London Heathrow | LHR | London | UK | 双平行跑道夹T2/T3/T5航站楼群 | 大型复合型 | 必选 |
| London Gatwick | LGW | London | UK | 单跑道+双航站楼，紧凑布局 | 紧凑跑道型 | |
| Paris Charles de Gaulle | CDG | Paris | France | 1号航站楼正圆形，卫星辨识度极高 | 大型复合型 | 必选 |
| Amsterdam Schiphol | AMS | Amsterdam | Netherlands | 六方向跑道放射网络 | 大型复合型 | 必选 |
| Frankfurt Airport | FRA | Frankfurt | Germany | 双平行跑道组+第三跑道，巨型货运区 | 大型复合型 | |
| Munich Airport | MUC | Munich | Germany | 双跑道夹中央航站楼，轴对称布局 | 标准枢纽型 | |
| Madrid Barajas | MAD | Madrid | Spain | 四跑道，波浪形T4航站楼屋顶可见 | 大型复合型 | |
| Barcelona El Prat | BCN | Barcelona | Spain | L形跑道布局，地中海近岸 | 标准枢纽型 | |
| Rome Fiumicino | FCO | Rome | Italy | 三跑道，伸入第勒尼安海海岸 | 大型复合型 | |
| Zurich Airport | ZRH | Zurich | Switzerland | Y形三跑道，阿尔卑斯山背景 | 标准枢纽型 | |
| Vienna International | VIE | Vienna | Austria | 平行双跑道+斜向第三跑道 | 标准枢纽型 | |
| Stockholm Arlanda | ARN | Stockholm | Sweden | 三跑道，森林包围，北欧特征地貌 | 标准枢纽型 | |
| Athens International | ATH | Athens | Greece | 双跑道，平原地形，海湾远景 | 标准枢纽型 | |
| Keflavik International | KEF | Reykjavik | Iceland | 跑道建在熔岩平原上，地形极有特征 | 标准枢纽型 | 高纬度注意图质 |
| Helsinki Vantaa | HEL | Helsinki | Finland | 三跑道Y形布局，北欧针叶林包围 | 标准枢纽型 | |

## 北美洲非美国 (6)

| 机场全名 | IATA | 城市 | 国家 | 截图建议 | Zoom档位 | 备注 |
|---|---|---|---|---|---|---|
| Toronto Pearson | YYZ | Toronto | Canada | 双跑道组，巨型T1椭圆航站楼 | 大型复合型 | |
| Vancouver International | YVR | Vancouver | Canada | Sea Island，三面环水，海景跑道 | 标准枢纽型 | 必选 |
| Montreal Trudeau | YUL | Montreal | Canada | 单跑道+弧形航站楼，城市内嵌 | 紧凑跑道型 | |
| Mexico City International | MEX | Mexico City | Mexico | 城市内嵌，跑道被市区包围，视觉震撼 | 标准枢纽型 | |
| Cancun International | CUN | Cancun | Mexico | 跑道夹在热带丛林和加勒比海湾之间 | 标准枢纽型 | 必选 |
| Tocumen International | PTY | Panama City | Panama | 跑道旁即为丛林，热带低地地貌 | 标准枢纽型 | |

## 南美洲 (6)

| 机场全名 | IATA | 城市 | 国家 | 截图建议 | Zoom档位 | 备注 |
|---|---|---|---|---|---|---|
| Guarulhos International | GRU | São Paulo | Brazil | 双跑道，大型枢纽，城郊丘陵 | 标准枢纽型 | |
| Galeão International | GIG | Rio de Janeiro | Brazil | 瓜纳巴拉湾岛上机场，水体包围 | 大型复合型 | 必选 |
| Ezeiza International | EZE | Buenos Aires | Argentina | 双跑道，潘帕斯草原平原地貌 | 标准枢纽型 | |
| Santiago International | SCL | Santiago | Chile | 单跑道，安第斯山脉背景 | 紧凑跑道型 | |
| El Dorado International | BOG | Bogotá | Colombia | 双平行跑道，高原盆地，云层常见 | 标准枢纽型 | |
| Jorge Chávez International | LIM | Lima | Peru | 跑道紧贴太平洋海岸，沙漠地貌 | 紧凑跑道型 | 必选 |

## 非洲 (5)

| 机场全名 | IATA | 城市 | 国家 | 截图建议 | Zoom档位 | 备注 |
|---|---|---|---|---|---|---|
| Cairo International | CAI | Cairo | Egypt | 沙漠地貌，多跑道，尼罗河三角洲边缘 | 标准枢纽型 | |
| O.R. Tambo International | JNB | Johannesburg | South Africa | 双跑道，高原地貌，红土色 | 标准枢纽型 | |
| Cape Town International | CPT | Cape Town | South Africa | 单跑道，桌山背景，海湾远景 | 紧凑跑道型 | 必选 |
| Mohammed V International | CMN | Casablanca | Morocco | 双跑道，荒漠过渡地带 | 标准枢纽型 | |
| Bole International | ADD | Addis Ababa | Ethiopia | 高原机场，非洲航空枢纽，埃航主基地 | 标准枢纽型 | |

## 大洋洲 (5)

| 机场全名 | IATA | 城市 | 国家 | 截图建议 | Zoom档位 | 备注 |
|---|---|---|---|---|---|---|
| Sydney Kingsford Smith | SYD | Sydney | Australia | 博塔尼湾弧形海岸，跑道伸入海湾 | 大型复合型 | 必选 |
| Melbourne Tullamarine | MEL | Melbourne | Australia | 三跑道，澳洲平原地貌 | 标准枢纽型 | |
| Brisbane Airport | BNE | Brisbane | Australia | 双跑道，一条伸入海湾 | 标准枢纽型 | |
| Auckland Airport | AKL | Auckland | New Zealand | 单跑道，Manukau湾近岸 | 紧凑跑道型 | |
| Perth Airport | PER | Perth | Australia | 双跑道，西澳平原，极度孤立地理位置 | 标准枢纽型 | |

---

## 待办（进入CC prompt前确认）

- [ ] 逐条核对IATA码准确性
- [ ] 实际跑图前查好每个机场的精确lat/lng（跑道几何中心或航站楼区域）
- [ ] 数据schema确认为 `{ name, iata, city, country, region, lat, lng, imageFile }`
- [ ] 答案校验逻辑：城市名、机场全名、IATA码三者任一匹配均算正确
- [ ] 同城双机场（北京PEK/PKX、上海PVG/SHA、东京HND/NRT、大阪KIX/ITM、伦敦LHR/LGW）需在autocomplete里明确区分，不能只输入城市名判定为正确
