# World City Quiz (IV) 城市清单 + Hint体系草案

只做Satellite版本,共54城,六大洲覆盖,Hint体系四级。坐标(lat/lng)未填,建议实际跑图前用Google Maps右键查精确坐标,本文档不提供经纬度以免数据有误。Hint 4冷知识为英文,因为游戏界面以英文为主。

## Hint体系(四级)

1. 大洲 region字段,6大洲简单分组(Africa / Asia / Europe / North America / South America / Oceania),零成本,数据字段直出
2. 国家 country字段,零成本,数据字段直出
3. 城市名首字母 自动从name字段取首字母,零成本,无需额外建表(多词城市取第一个词首字母,如Hong Kong→H,Cape Town→C)
4. 一句话冷知识(英文) 不直接说出城市名,见下表funFact列

## Zoom档位定义

- 紧凑地标型(单体建筑/小范围地标) zoom约15
- 街区网络型(路网/运河网/河流弯道) zoom约13
- 大尺度地貌型(海岸线/港湾/山脉背景) zoom约11-12

---

## 亚洲 (16)

| 城市 | 国家 | 截图地标建议 | zoom档位 | 第四级冷知识 (英文) |
|---|---|---|---|---|
| Beijing | China | 紫禁城+护城河方形轮廓 | 街区网络型 | This city is home to the largest surviving ancient palace complex in the world. |
| Shanghai | China | 外滩+黄浦江弯道 | 街区网络型 | This is the country's largest financial center, with a river splitting the skyline into an old bund and a futuristic new district. |
| Hong Kong | China | 维多利亚港+山海夹城轮廓 | 大尺度地貌型 | A former British colony known for its skyscraper skyline rising on both sides of a deep natural harbor. |
| Tokyo | Japan | 皇居护城河+周边密集街区 | 街区网络型 | One of the most populous metropolitan areas in the world, and a global hub for anime and pop culture. |
| Osaka | Japan | 大阪城护城河 | 紧凑地标型 | Famous for a 16th century castle surrounded by a massive moat, and widely considered the food capital of its country. |
| Kyoto | Japan | 清水寺或金阁寺周边山地 | 紧凑地标型(风险) | Once the imperial capital for over a thousand years, home to more UNESCO World Heritage temples than any other city in its country. |
| Seoul | South Korea | 汉江弯道+南山 | 街区网络型 | A major river splits this capital into northern and southern halves, with mountains ringing the city. |
| Singapore | Singapore | 滨海湾花园穹顶+金沙酒店 | 紧凑地标型 | A city-state known for a futuristic garden complex topped with structures shaped like a giant ship. |
| Bangkok | Thailand | 湄南河弯道+大皇宫 | 街区网络型 | Home to an ornate royal palace complex along the banks of a winding river. |
| Dubai | UAE | 棕榈岛 | 紧凑地标型 | Home to the world's tallest building and a set of artificial islands shaped like palm trees. |
| Doha | Qatar | The Pearl人工岛 | 紧凑地标型 | The capital of a Gulf nation that hosted a recent FIFA World Cup. |
| Mumbai | India | 半岛海岸轮廓 | 大尺度地貌型 | The center of the country's film industry, located on a peninsula along the coast. |
| Agra | India | 泰姬陵 | 紧凑地标型 | Home to a white marble mausoleum built for a deceased queen, often called one of the new seven wonders of the world. |
| Istanbul | Turkey | 博斯普鲁斯海峡+金角湾 | 大尺度地貌型 | One of the few cities in the world that sits on two continents at once. |
| Hanoi | Vietnam | 还剑湖周边 | 街区网络型(风险) | This capital's old quarter wraps around a lake said to be home to a legendary giant turtle. |
| Kuala Lumpur | Malaysia | 双子塔 | 紧凑地标型(风险) | Home to twin towers that once held the record for the tallest buildings in the world, and still the tallest twin towers today. |

## 欧洲 (14)

| 城市 | 国家 | 截图地标建议 | zoom档位 | 第四级冷知识 (英文) |
|---|---|---|---|---|
| Paris | France | 埃菲尔铁塔+战神广场+塞纳河弯道 | 街区网络型 | A tower built as a temporary structure for a World's Fair became this city's defining landmark. |
| Venice | Italy | 运河网络 | 街区网络型 | An entire city built across more than a hundred small islands in a lagoon, with canals instead of streets. |
| Rome | Italy | 斗兽场+台伯河弯道 | 街区网络型 | Once the capital of an empire that lasted a thousand years, and still home to an independent papal state within its walls. |
| Milan | Italy | 大教堂+放射状路网 | 街区网络型 | A global fashion capital with one of the largest Gothic cathedrals in Europe. |
| London | UK | 泰晤士河弯道+伦敦眼 | 街区网络型 | A large observation wheel stands on one bank of this river, facing a parliament building and its famous clock tower. |
| Frankfurt | Germany | 金融区摩天楼群 | 紧凑地标型 | Home to the headquarters of the European Central Bank, often called continental Europe's financial center. |
| Munich | Germany | 老城护城河环路或奥林匹克公园 | 街区网络型(风险) | Host to the world's largest beer festival every autumn. |
| Moscow | Russia | 红场+克里姆林宫 | 紧凑地标型 | A fortified citadel beside a famous red-paved square serves as the seat of power for this country. |
| Barcelona | Spain | 圣家堂+Eixample网格区 | 街区网络型 | Home to a cathedral that has been under construction for more than 140 years. |
| Amsterdam | Netherlands | 运河环状网络 | 街区网络型 | A city built around a network of concentric canals, with more bicycles than residents. |
| Vienna | Austria | 环城大道Ringstrasse | 街区网络型(风险) | Once the imperial capital of a major European dynasty, famous for its classical music tradition. |
| Prague | Czechia | 伏尔塔瓦河弯道+查理大桥 | 街区网络型 | An astronomical clock in the old town square has been telling time here since the medieval era. |
| Santorini | Greece | 火山口弧形海湾 | 大尺度地貌型 | A crescent-shaped island formed by a volcanic eruption, known for its white and blue buildings. |
| Reykjavik | Iceland | 海岸轮廓+地热区 | 大尺度地貌型(风险,高纬度) | One of the northernmost capitals of any sovereign country, heated almost entirely by geothermal energy. |

## 北美洲非美国 (5)

| 城市 | 国家 | 截图地标建议 | zoom档位 | 第四级冷知识 (英文) |
|---|---|---|---|---|
| Vancouver | Canada | 海港+山脉背景半岛轮廓 | 大尺度地貌型 | A port city surrounded by mountains on three sides and the sea on the fourth, regularly ranked among the world's most livable cities. |
| Toronto | Canada | CN塔+安大略湖岸 | 街区网络型 | Once home to the tallest freestanding structure in North America, sitting beside one of the Great Lakes. |
| Mexico City | Mexico | 索卡洛广场+方格路网 | 街区网络型 | Built atop a drained lakebed, once the capital of an ancient empire. |
| Havana | Cuba | Malecón海滨大道弧形海岸 | 大尺度地貌型 | A seaside city famous for its colorful vintage cars and colonial architecture. |
| Panama City | Panama | 运河入口 | 大尺度地貌型 | Located right beside a canal that connects the Pacific and Atlantic Oceans. |

## 南美洲 (6)

| 城市 | 国家 | 截图地标建议 | zoom档位 | 第四级冷知识 (英文) |
|---|---|---|---|---|
| Rio de Janeiro | Brazil | 瓜纳巴拉湾+基督像山头 | 大尺度地貌型 | A giant statue with outstretched arms stands on a mountaintop overlooking this bay city. |
| São Paulo | Brazil | 高密度市中心天际线 | 街区网络型(风险) | The most populous city in the Southern Hemisphere, known for its dense high rise skyline. |
| Buenos Aires | Argentina | 拉普拉塔河口+方格路网 | 街区网络型 | The birthplace of tango, sitting along the banks of a wide river estuary. |
| Santiago | Chile | 安第斯山背景+城市轮廓 | 大尺度地貌型 | A city at the foot of a famous mountain range, with snow capped peaks visible most of the year. |
| Cartagena | Colombia | 老城+加勒比海岸轮廓 | 大尺度地貌型 | A Caribbean port city famous for its well preserved colonial walls. |
| La Paz | Bolivia | 盆地地形城市轮廓 | 大尺度地貌型(风险) | The highest administrative capital in the world, built inside a massive valley basin. |

## 非洲 (7)

| 城市 | 国家 | 截图地标建议 | zoom档位 | 第四级冷知识 (英文) |
|---|---|---|---|---|
| Cairo | Egypt | 吉萨金字塔群 | 紧凑地标型 | On the edge of this city stands the only surviving structure from the seven wonders of the ancient world. |
| Cape Town | South Africa | 桌山+海岸线 | 大尺度地貌型 | A seaside city backed by a famous flat-topped mountain. |
| Marrakech | Morocco | 老城麦地那城墙轮廓 | 街区网络型 | An ancient walled city known for its red walls and bustling open air market square. |
| Casablanca | Morocco | 哈桑二世清真寺海岸位置 | 紧凑地标型 | A port city made world famous by a classic Hollywood film, even though the movie was never actually filmed there. |
| Nairobi | Kenya | 城市边缘紧邻国家公园轮廓 | 大尺度地貌型(风险) | One of the few capital cities in the world with a wildlife national park right at its edge. |
| Zanzibar (Stone Town) | Tanzania | 半岛老城轮廓 | 街区网络型 | An old town on an Indian Ocean island that was once the center of the East African spice trade. |
| Lagos | Nigeria | 潟湖城市轮廓 | 大尺度地貌型(风险) | One of the most populous cities in Africa, built across a lagoon. |

## 大洋洲 (6)

| 城市 | 国家 | 截图地标建议 | zoom档位 | 第四级冷知识 (英文) |
|---|---|---|---|---|
| Sydney | Australia | 悉尼歌剧院+海港大桥 | 紧凑地标型 | A white sail shaped opera house stands beside the harbor, the city's most famous landmark. |
| Melbourne | Australia | 雅拉河弯道+市中心网格 | 街区网络型 | Regularly ranked among the world's most livable cities, known for its coffee culture and tram network. |
| Auckland | New Zealand | 两海港地峡轮廓 | 大尺度地貌型 | Built on a narrow isthmus between two harbors, with nearly fifty dormant volcanic cones within the city. |
| Wellington | New Zealand | 海港+山地轮廓 | 大尺度地貌型(风险) | The southernmost national capital in the world, known for being very windy. |
| Gold Coast | Australia | 海滩+运河社区 | 街区网络型(风险) | Famous for its long stretch of surf beaches, one of the most popular vacation destinations in its country. |
| Fiji (Nadi/Denarau) | Fiji | 珊瑚礁岛屿轮廓 | 大尺度地貌型(风险) | An island nation in the South Pacific known for its coral reefs and resorts. |

---

## 待办(进入CC prompt前需要确认)

- [x] 第四级冷知识已改为英文,游戏内容默认英文
- [ ] 逐条核对冷知识准确性,有疑问的标出来改
- [ ] 实际跑图前查好每个城市的精确lat/lng(landmark坐标,非城市行政质心)
- [ ] 数据schema最终定为 `{ name, lat, lng, country, region, funFact, imageFile }`
- [ ] hint 3(首字母)的多词城市取词规则在组件里写清楚
