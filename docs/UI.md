√ Update NordicTheme.ts color palette based on reference images
     ■ Restyle HomeScreen.tsx with Nordic design
     □ Restyle RestaurantCard and MenuListItem components
     □ Restyle LoginScreen with Nordic theme
     □ Restyle remaining screens (Profile, Cart, Orders, etc.)
     □ Restyle remaining components (CartBar, StatusCapsule, LocationDisplay)



1.[Image #1]移动端界面配色参考这个图片，详细内容如下：如何设计出这种“简约+质感”的北欧风App
这类北欧风格的外卖App UI，适合任何做食品、快选服务、城市生活App 的朋友借鉴。下面我拆解一下这类设计的7个关键技巧，助你打造一个让用户留设计要“可点又可扫”
“Popular Category”和“Most Ordered”模块采用了图文结合的圆形按钮+滚动卡片结构，视觉轻+操作快。图标统一风格、底部留名，易于滑动浏览。
6｜底部导航轻而稳
四个Tab：Home、Order、Favourite、Notification
• 图标线条干净，选中态用主色填充
• 无文字的“极简导航”慎用，这种“图+文”组合更适合功能型App
• 保证点击区域够大（44px以上），避免误触
7｜北欧风 ≠ 冷淡风，要有人情味！
语音搜索按钮、配送时间、免费标签、追踪按钮这些细节，是让用户感到“贴心”的设计。把功能藏在温柔的外表下，是高级感的来源。
简约不是扁平，干净不是空白，北欧风的核心是节制与克制中的细节表达。设计这类App，不是加设计感，而是减信息负担，让用户动手前，先舒服。
2.[Image #2]参考这个图片的浅底渐变；阴影只在可点元素上，列表以分组留白区隔。其他未提及的（颜色）不要参考
3.[Image #3]参考这个图片的卡片风格：磨砂风格。flutter提供了Material组件库，用于创建按钮、图标、导航栏。设计中的圆形图片和卡片风格通过Container和ClipRRect实现，列表展示则由ListView和GridView完成，`。不要参考颜色和阴影设计 不要修改跳转逻辑，只改变移动端的UI设计和配色，先不要删除任何一个按钮和图片文字等等（总之不要删除现有的任何逻辑）,已经改过的就不要重复改了，继续改



√ Update NordicTheme.ts 1m 487)alette based on reference images
     √ Restyle HomeScreen.tsx with Nordic design
     ■ Restyle RestaurantCard and MenuListItem components
     □ RestyleLoginScreen with Nordic theme ,              ,                )
     □ Restyle remaining screens (Profile, Cart, Orders, etc.)
     □ Restyle remaining components (CartBar, StatusCapsule, LocationDisplay)

D盘的FoodMate-AI的跳转逻辑设计一下：
1.尤其是完成订单支付后点击查看订单，之后没有返回主页面的按钮。
2.首页能不能设计一下，高端一点，符合用户要求，有购买的欲望。现在有好多模拟按钮太影响观感了，可不可以集中放在一个按钮点
开有多种模拟按钮。但不要删除任何一个按钮功能

> [recommendation-service 4/9] RUN pip install --no-cache-dir -r requirements.txt:
7.263 Looking in indexes: https://pypi.org/simple, https://download.pytorch.org/whl/cpu
8.678 Collecting fastapi>=0.109.0 (from -r requirements.txt (line 4))       
9.515   Downloading fastapi-0.135.2-py3-none-any.whl.metadata (28 kB)       
9.988 Collecting uvicorn>=0.24.0 (from -r requirements.txt (line 5))        
10.10   Downloading uvicorn-0.42.0-py3-none-any.whl.metadata (6.7 kB)       
13.18 Collecting aiohttp>=3.9.1 (from -r requirements.txt (line 8))
13.37   Downloading aiohttp-3.13.3-cp311-cp311-manylinux2014_x86_64.manylinux_2_17_x86_64.manylinux_2_28_x86_64.whl.metadata (8.1 kB)
13.85 Collecting requests>=2.31.0 (from -r requirements.txt (line 9))       
13.95   Downloading requests-2.32.5-py3-none-any.whl.metadata (4.9 kB)      
15.28 Collecting pydantic>=2.5.2 (from -r requirements.txt (line 12))       
15.38   Downloading pydantic-2.12.5-py3-none-any.whl.metadata (90 kB)       
15.50      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 90.6/90.6 kB 788.5 kB/s eta 0:00:00
16.34 Collecting python-dateutil>=2.8.2 (from -r requirements.txt (line 15))
16.44   Downloading python_dateutil-2.9.0.post0-py2.py3-none-any.whl.metadata (8.4 kB)
17.55 Collecting pandas>=2.1.0 (from -r requirements.txt (line 18))
17.66   Downloading pandas-3.0.1-cp311-cp311-manylinux_2_24_x86_64.manylinux_2_28_x86_64.whl.metadata (79 kB)
17.69      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 79.5/79.5 kB 3.5 MB/s eta 0:00:00
21.36 Collecting numpy>=1.24.0 (from -r requirements.txt (line 19))
21.46   Downloading numpy-2.4.3-cp311-cp311-manylinux_2_27_x86_64.manylinux_2_28_x86_64.whl.metadata (6.6 kB)
22.36 Collecting lightgbm>=4.0.0 (from -r requirements.txt (line 22))       
22.47   Downloading lightgbm-4.6.0-py3-none-manylinux_2_28_x86_64.whl.metadata (17 kB)
23.52 Collecting scikit-learn>=1.3.0 (from -r requirements.txt (line 23))   
23.63   Downloading scikit_learn-1.8.0-cp311-cp311-manylinux_2_27_x86_64.manylinux_2_28_x86_64.whl.metadata (11 kB)
25.30 Collecting torch==2.5.1 (from -r requirements.txt (line 26))
25.37   Downloading https://download.pytorch.org/whl/cpu/torch-2.5.1%2Bcpu-cp311-cp311-linux_x86_64.whl (174.7 MB)
81.79      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 174.7/174.7 MB 2.0 MB/s eta 0:00:00
85.28 Collecting torchvision==0.20.1 (from -r requirements.txt (line 27))   
85.74   Downloading https://download-r2.pytorch.org/whl/cpu/torchvision-0.20.1%2Bcpu-cp311-cp311-linux_x86_64.whl (1.8 MB)
86.95      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 1.8/1.8 MB 1.5 MB/s eta 0:00:00
89.51 Collecting transformers<5.0.0,>=4.38.0 (from -r requirements.txt (line 31))
89.63   Downloading transformers-4.57.6-py3-none-any.whl.metadata (43 kB)   
89.76      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 44.0/44.0 kB 295.5 kB/s eta 0:00:00
91.47 Collecting sentencepiece>=0.1.99 (from -r requirements.txt (line 32)) 
91.58   Downloading sentencepiece-0.2.1-cp311-cp311-manylinux_2_27_x86_64.manylinux_2_28_x86_64.whl.metadata (10 kB)
93.21 Collecting peft>=0.7.0 (from -r requirements.txt (line 33))
93.32   Downloading peft-0.18.1-py3-none-any.whl.metadata (14 kB)
94.76 Collecting PyJWT>=2.8.0 (from -r requirements.txt (line 36))
94.86   Downloading pyjwt-2.12.1-py3-none-any.whl.metadata (4.1 kB)
103.0 Collecting cryptography>=41.0.0 (from -r requirements.txt (line 37))  
103.1   Downloading cryptography-46.0.5-cp311-abi3-manylinux_2_34_x86_64.whl.metadata (5.7 kB)
104.2 Collecting openai>=1.10.0 (from -r requirements.txt (line 40))        
104.3   Downloading openai-2.29.0-py3-none-any.whl.metadata (29 kB)
106.5 Collecting langchain>=0.1.0 (from -r requirements.txt (line 43))      
106.7   Downloading langchain-1.2.13-py3-none-any.whl.metadata (5.8 kB)     
109.2 Collecting langgraph>=0.0.40 (from -r requirements.txt (line 44))     
109.4   Downloading langgraph-1.1.3-py3-none-any.whl.metadata (7.4 kB)      
110.9 Collecting langchain-openai>=0.0.5 (from -r requirements.txt (line 45))
111.2   Downloading langchain_openai-1.1.12-py3-none-any.whl.metadata (3.1 kB)
112.4 Collecting langchain-community>=0.0.10 (from -r requirements.txt (line 46))
112.5   Downloading langchain_community-0.4.1-py3-none-any.whl.metadata (3.0 kB)
113.0 Collecting mcp>=1.0.0 (from -r requirements.txt (line 49))
113.1   Downloading mcp-1.26.0-py3-none-any.whl.metadata (89 kB)
113.7      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 89.5/89.5 kB 185.5 kB/s eta 0:00:00
114.4 Collecting fastmcp>=0.2.0 (from -r requirements.txt (line 50))        
114.5   Downloading fastmcp-3.1.1-py3-none-any.whl.metadata (8.1 kB)        
115.0 Collecting python-dotenv>=1.0.0 (from -r requirements.txt (line 53))  
115.1   Downloading python_dotenv-1.2.2-py3-none-any.whl.metadata (27 kB)   
116.2 Collecting pydantic-settings>=2.1.0 (from -r requirements.txt (line 56))
116.3   Downloading pydantic_settings-2.13.1-py3-none-any.whl.metadata (3.4 kB)
116.8 Collecting structlog>=23.2.0 (from -r requirements.txt (line 59))     
116.9   Downloading structlog-25.5.0-py3-none-any.whl.metadata (9.5 kB)     
117.6 Collecting pytest>=7.4.0 (from -r requirements.txt (line 62))
117.7   Downloading pytest-9.0.2-py3-none-any.whl.metadata (7.6 kB)
118.3 Collecting pytest-asyncio>=0.21.0 (from -r requirements.txt (line 63))
118.4   Downloading pytest_asyncio-1.3.0-py3-none-any.whl.metadata (4.1 kB) 
119.3 Collecting httpx>=0.27.0 (from -r requirements.txt (line 64))
119.4   Downloading httpx-0.28.1-py3-none-any.whl.metadata (7.1 kB)
120.7 Collecting filelock (from torch==2.5.1->-r requirements.txt (line 26))
120.8   Downloading filelock-3.25.2-py3-none-any.whl.metadata (2.0 kB)      
121.8 Collecting typing-extensions>=4.8.0 (from torch==2.5.1->-r requirements.txt (line 26))
121.9   Downloading https://download.pytorch.org/whl/typing_extensions-4.15.0-py3-none-any.whl.metadata (3.3 kB)
123.3 Collecting networkx (from torch==2.5.1->-r requirements.txt (line 26))
123.4   Downloading networkx-3.6.1-py3-none-any.whl.metadata (6.8 kB)       
123.9 Collecting jinja2 (from torch==2.5.1->-r requirements.txt (line 26))  
124.0   Downloading https://download.pytorch.org/whl/jinja2-3.1.6-py3-none-any.whl.metadata (2.9 kB)
124.9 Collecting fsspec (from torch==2.5.1->-r requirements.txt (line 26))  
125.0   Downloading fsspec-2026.2.0-py3-none-any.whl.metadata (10 kB)       
126.2 Collecting sympy==1.13.1 (from torch==2.5.1->-r requirements.txt (line 26))
126.3   Downloading sympy-1.13.1-py3-none-any.whl.metadata (12 kB)
131.2 Collecting pillow!=8.3.*,>=5.3.0 (from torchvision==0.20.1->-r requirements.txt (line 27))
131.3   Downloading pillow-12.1.1-cp311-cp311-manylinux_2_27_x86_64.manylinux_2_28_x86_64.whl.metadata (8.8 kB)
131.9 Collecting mpmath<1.4,>=1.1.0 (from sympy==1.13.1->torch==2.5.1->-r requirements.txt (line 26))
132.0   Downloading mpmath-1.3.0-py3-none-any.whl.metadata (8.6 kB)
133.2 Collecting starlette>=0.46.0 (from fastapi>=0.109.0->-r requirements.txt (line 4))
133.3   Downloading starlette-1.0.0-py3-none-any.whl.metadata (6.3 kB)      
134.3 Collecting typing-inspection>=0.4.2 (from fastapi>=0.109.0->-r requirements.txt (line 4))
134.4   Downloading typing_inspection-0.4.2-py3-none-any.whl.metadata (2.6 kB)
134.9 Collecting annotated-doc>=0.0.2 (from fastapi>=0.109.0->-r requirements.txt (line 4))
135.0   Downloading annotated_doc-0.0.4-py3-none-any.whl.metadata (6.6 kB)  
136.1 Collecting click>=7.0 (from uvicorn>=0.24.0->-r requirements.txt (line 5))
136.2   Downloading click-8.3.1-py3-none-any.whl.metadata (2.6 kB)
137.1 Collecting h11>=0.8 (from uvicorn>=0.24.0->-r requirements.txt (line 5))
137.2   Downloading h11-0.16.0-py3-none-any.whl.metadata (8.3 kB)
138.3 Collecting aiohappyeyeballs>=2.5.0 (from aiohttp>=3.9.1->-r requirements.txt (line 8))
138.5   Downloading aiohappyeyeballs-2.6.1-py3-none-any.whl.metadata (5.9 kB)
138.9 Collecting aiosignal>=1.4.0 (from aiohttp>=3.9.1->-r requirements.txt (line 8))
139.0   Downloading aiosignal-1.4.0-py3-none-any.whl.metadata (3.7 kB)      
140.0 Collecting attrs>=17.3.0 (from aiohttp>=3.9.1->-r requirements.txt (line 8))
140.1   Downloading attrs-26.1.0-py3-none-any.whl.metadata (8.8 kB)
142.0 Collecting frozenlist>=1.1.1 (from aiohttp>=3.9.1->-r requirements.txt (line 8))
142.1   Downloading frozenlist-1.8.0-cp311-cp311-manylinux1_x86_64.manylinux_2_28_x86_64.manylinux_2_5_x86_64.whl.metadata (20 kB)
146.5 Collecting multidict<7.0,>=4.5 (from aiohttp>=3.9.1->-r requirements.txt (line 8))
146.7   Downloading multidict-6.7.1-cp311-cp311-manylinux2014_x86_64.manylinux_2_17_x86_64.manylinux_2_28_x86_64.whl.metadata (5.3 kB)
148.3 Collecting propcache>=0.2.0 (from aiohttp>=3.9.1->-r requirements.txt (line 8))
148.4   Downloading propcache-0.4.1-cp311-cp311-manylinux2014_x86_64.manylinux_2_17_x86_64.manylinux_2_28_x86_64.whl.metadata (13 kB)
153.9 Collecting yarl<2.0,>=1.17.0 (from aiohttp>=3.9.1->-r requirements.txt (line 8))
154.0   Downloading yarl-1.23.0-cp311-cp311-manylinux2014_x86_64.manylinux_2_17_x86_64.manylinux_2_28_x86_64.whl.metadata (79 kB)
154.7      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 79.6/79.6 kB 142.8 kB/s eta 0:00:00
157.0 Collecting charset_normalizer<4,>=2 (from requests>=2.31.0->-r requirements.txt (line 9))
157.1   Downloading charset_normalizer-3.4.6-cp311-cp311-manylinux2014_x86_64.manylinux_2_17_x86_64.manylinux_2_28_x86_64.whl.metadata (40 kB)
157.3      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 40.6/40.6 kB 211.1 kB/s eta 0:00:00
158.0 Collecting idna<4,>=2.5 (from requests>=2.31.0->-r requirements.txt (line 9))
158.1   Downloading idna-3.11-py3-none-any.whl.metadata (8.4 kB)
158.9 Collecting urllib3<3,>=1.21.1 (from requests>=2.31.0->-r requirements.txt (line 9))
159.1   Downloading urllib3-2.6.3-py3-none-any.whl.metadata (6.9 kB)        
159.9 Collecting certifi>=2017.4.17 (from requests>=2.31.0->-r requirements.txt (line 9))
160.1   Downloading certifi-2026.2.25-py3-none-any.whl.metadata (2.5 kB)    
161.0 Collecting annotated-types>=0.6.0 (from pydantic>=2.5.2->-r requirements.txt (line 12))
161.2   Downloading annotated_types-0.7.0-py3-none-any.whl.metadata (15 kB) 
183.6 Collecting pydantic-core==2.41.5 (from pydantic>=2.5.2->-r requirements.txt (line 12))
184.4   Downloading pydantic_core-2.41.5-cp311-cp311-manylinux_2_17_x86_64.manylinux2014_x86_64.whl.metadata (7.3 kB)
188.2 Collecting six>=1.5 (from python-dateutil>=2.8.2->-r requirements.txt (line 15))
188.3   Downloading six-1.17.0-py2.py3-none-any.whl.metadata (1.7 kB)       
191.7 Collecting scipy (from lightgbm>=4.0.0->-r requirements.txt (line 22))
191.9   Downloading scipy-1.17.1-cp311-cp311-manylinux_2_27_x86_64.manylinux_2_28_x86_64.whl.metadata (62 kB)
192.8      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 62.1/62.1 kB 82.0 kB/s eta 0:00:00
194.1 Collecting joblib>=1.3.0 (from scikit-learn>=1.3.0->-r requirements.txt (line 23))
194.2   Downloading joblib-1.5.3-py3-none-any.whl.metadata (5.5 kB)
194.8 Collecting threadpoolctl>=3.2.0 (from scikit-learn>=1.3.0->-r requirements.txt (line 23))
194.9   Downloading threadpoolctl-3.6.0-py3-none-any.whl.metadata (13 kB)   
199.1 Collecting huggingface-hub<1.0,>=0.34.0 (from transformers<5.0.0,>=4.38.0->-r requirements.txt (line 31))
199.3   Downloading huggingface_hub-0.36.2-py3-none-any.whl.metadata (15 kB)
200.1 Collecting packaging>=20.0 (from transformers<5.0.0,>=4.38.0->-r requirements.txt (line 31))
200.3   Downloading packaging-26.0-py3-none-any.whl.metadata (3.3 kB)       
202.2 Collecting pyyaml>=5.1 (from transformers<5.0.0,>=4.38.0->-r requirements.txt (line 31))
202.3   Downloading pyyaml-6.0.3-cp311-cp311-manylinux2014_x86_64.manylinux_2_17_x86_64.manylinux_2_28_x86_64.whl.metadata (2.4 kB)
208.7 Collecting regex!=2019.12.17 (from transformers<5.0.0,>=4.38.0->-r requirements.txt (line 31))
208.8   Downloading regex-2026.2.28-cp311-cp311-manylinux2014_x86_64.manylinux_2_17_x86_64.manylinux_2_28_x86_64.whl.metadata (40 kB)
209.2      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 40.4/40.4 kB 165.3 kB/s eta 0:00:00
213.2 Collecting tokenizers<=0.23.0,>=0.22.0 (from transformers<5.0.0,>=4.38.0->-r requirements.txt (line 31))
213.3   Downloading tokenizers-0.22.2-cp39-abi3-manylinux_2_17_x86_64.manylinux2014_x86_64.whl.metadata (7.3 kB)
217.3 Collecting safetensors>=0.4.3 (from transformers<5.0.0,>=4.38.0->-r requirements.txt (line 31))
217.5   Downloading safetensors-0.7.0-cp38-abi3-manylinux_2_17_x86_64.manylinux2014_x86_64.whl.metadata (4.1 kB)
218.8 Collecting tqdm>=4.27 (from transformers<5.0.0,>=4.38.0->-r requirements.txt (line 31))
219.0   Downloading tqdm-4.67.3-py3-none-any.whl.metadata (57 kB)
219.9      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 57.7/57.7 kB 64.2 kB/s eta 0:00:00
224.0 Collecting psutil (from peft>=0.7.0->-r requirements.txt (line 33))   
224.1   Downloading psutil-7.2.2-cp36-abi3-manylinux2010_x86_64.manylinux_2_12_x86_64.manylinux_2_28_x86_64.whl.metadata (22 kB)
225.2 Collecting accelerate>=0.21.0 (from peft>=0.7.0->-r requirements.txt (line 33))
225.3   Downloading accelerate-1.13.0-py3-none-any.whl.metadata (19 kB)     
231.6 Collecting cffi>=2.0.0 (from cryptography>=41.0.0->-r requirements.txt (line 37))
231.7   Downloading cffi-2.0.0-cp311-cp311-manylinux2014_x86_64.manylinux_2_17_x86_64.whl.metadata (2.6 kB)
232.7 Collecting anyio<5,>=3.5.0 (from openai>=1.10.0->-r requirements.txt (line 40))
232.9   Downloading anyio-4.13.0-py3-none-any.whl.metadata (4.5 kB)
233.4 Collecting distro<2,>=1.7.0 (from openai>=1.10.0->-r requirements.txt (line 40))
233.5   Downloading distro-1.9.0-py3-none-any.whl.metadata (6.8 kB)
236.2 Collecting jiter<1,>=0.10.0 (from openai>=1.10.0->-r requirements.txt (line 40))
236.3   Downloading jiter-0.13.0-cp311-cp311-manylinux_2_17_x86_64.manylinux2014_x86_64.whl.metadata (5.2 kB)
237.6 Collecting sniffio (from openai>=1.10.0->-r requirements.txt (line 40))
237.7   Downloading sniffio-1.3.1-py3-none-any.whl.metadata (3.9 kB)        
240.2 Collecting langchain-core<2.0.0,>=1.2.10 (from langchain>=0.1.0->-r requirements.txt (line 43))
240.5   Downloading langchain_core-1.2.22-py3-none-any.whl.metadata (4.4 kB)
241.9 Collecting langgraph-checkpoint<5.0.0,>=2.1.0 (from langgraph>=0.0.40->-r requirements.txt (line 44))
242.0   Downloading langgraph_checkpoint-4.0.1-py3-none-any.whl.metadata (4.9 kB)
243.1 Collecting langgraph-prebuilt<1.1.0,>=1.0.8 (from langgraph>=0.0.40->-r requirements.txt (line 44))
243.2   Downloading langgraph_prebuilt-1.0.8-py3-none-any.whl.metadata (5.2 kB)
244.5 Collecting langgraph-sdk<0.4.0,>=0.3.0 (from langgraph>=0.0.40->-r requirements.txt (line 44))
244.7   Downloading langgraph_sdk-0.3.12-py3-none-any.whl.metadata (1.6 kB) 
247.5 Collecting xxhash>=3.5.0 (from langgraph>=0.0.40->-r requirements.txt (line 44))
247.6   Downloading xxhash-3.6.0-cp311-cp311-manylinux2014_x86_64.manylinux_2_17_x86_64.manylinux_2_28_x86_64.whl.metadata (13 kB)
249.4 Collecting tiktoken<1.0.0,>=0.7.0 (from langchain-openai>=0.0.5->-r requirements.txt (line 45))
249.9   Downloading tiktoken-0.12.0-cp311-cp311-manylinux_2_28_x86_64.whl.metadata (6.7 kB)
251.2 Collecting langchain-classic<2.0.0,>=1.0.0 (from langchain-community>=0.0.10->-r requirements.txt (line 46))
251.4   Downloading langchain_classic-1.0.3-py3-none-any.whl.metadata (4.8 kB)
259.0 Collecting SQLAlchemy<3.0.0,>=1.4.0 (from langchain-community>=0.0.10->-r requirements.txt (line 46))
259.1   Downloading sqlalchemy-2.0.48-cp311-cp311-manylinux2014_x86_64.manylinux_2_17_x86_64.manylinux_2_28_x86_64.whl.metadata (9.5 kB)
259.8 Collecting tenacity!=8.4.0,<10.0.0,>=8.1.0 (from langchain-community>=0.0.10->-r requirements.txt (line 46))
259.9   Downloading tenacity-9.1.4-py3-none-any.whl.metadata (1.2 kB)       
261.0 Collecting dataclasses-json<0.7.0,>=0.6.7 (from langchain-community>=0.0.10->-r requirements.txt (line 46))
261.1   Downloading dataclasses_json-0.6.7-py3-none-any.whl.metadata (25 kB)
264.3 Collecting langsmith<1.0.0,>=0.1.125 (from langchain-community>=0.0.10->-r requirements.txt (line 46))
264.4   Downloading langsmith-0.7.22-py3-none-any.whl.metadata (15 kB)      
264.9 Collecting httpx-sse<1.0.0,>=0.4.0 (from langchain-community>=0.0.10->-r requirements.txt (line 46))
265.0   Downloading httpx_sse-0.4.3-py3-none-any.whl.metadata (9.7 kB)      
266.3 Collecting jsonschema>=4.20.0 (from mcp>=1.0.0->-r requirements.txt (line 49))
266.4   Downloading jsonschema-4.26.0-py3-none-any.whl.metadata (7.6 kB)    
266.9 Collecting python-multipart>=0.0.9 (from mcp>=1.0.0->-r requirements.txt (line 49))
267.0   Downloading python_multipart-0.0.22-py3-none-any.whl.metadata (1.8 kB)
267.6 Collecting sse-starlette>=1.6.1 (from mcp>=1.0.0->-r requirements.txt (line 49))
267.7   Downloading sse_starlette-3.3.3-py3-none-any.whl.metadata (14 kB)   
268.4 Collecting authlib>=1.6.5 (from fastmcp>=0.2.0->-r requirements.txt (line 50))
268.5   Downloading authlib-1.6.9-py2.py3-none-any.whl.metadata (9.8 kB)    
269.2 Collecting cyclopts>=4.0.0 (from fastmcp>=0.2.0->-r requirements.txt (line 50))
269.3   Downloading cyclopts-4.10.1-py3-none-any.whl.metadata (12 kB)       
269.8 Collecting exceptiongroup>=1.2.2 (from fastmcp>=0.2.0->-r requirements.txt (line 50))
270.0   Downloading exceptiongroup-1.3.1-py3-none-any.whl.metadata (6.7 kB) 
270.8 Collecting jsonref>=1.1.0 (from fastmcp>=0.2.0->-r requirements.txt (line 50))
270.9   Downloading jsonref-1.1.0-py3-none-any.whl.metadata (2.7 kB)        
271.8 Collecting jsonschema-path>=0.3.4 (from fastmcp>=0.2.0->-r requirements.txt (line 50))
271.9   Downloading jsonschema_path-0.4.5-py3-none-any.whl.metadata (5.9 kB)
272.7 Collecting openapi-pydantic>=0.5.1 (from fastmcp>=0.2.0->-r requirements.txt (line 50))
272.9   Downloading openapi_pydantic-0.5.1-py3-none-any.whl.metadata (10 kB)
273.5 Collecting opentelemetry-api>=1.20.0 (from fastmcp>=0.2.0->-r requirements.txt (line 50))
273.6   Downloading opentelemetry_api-1.40.0-py3-none-any.whl.metadata (1.5 kB)
274.1 Collecting platformdirs>=4.0.0 (from fastmcp>=0.2.0->-r requirements.txt (line 50))
274.2   Downloading platformdirs-4.9.4-py3-none-any.whl.metadata (4.7 kB)   
274.6 Collecting py-key-value-aio<0.5.0,>=0.4.4 (from py-key-value-aio[filetree,keyring,memory]<0.5.0,>=0.4.4->fastmcp>=0.2.0->-r requirements.txt (line 50))
274.7   Downloading py_key_value_aio-0.4.4-py3-none-any.whl.metadata (15 kB)
275.2 Collecting pyperclip>=1.9.0 (from fastmcp>=0.2.0->-r requirements.txt (line 50))
275.3   Downloading pyperclip-1.11.0-py3-none-any.whl.metadata (2.4 kB)     
276.4 Collecting rich>=13.9.4 (from fastmcp>=0.2.0->-r requirements.txt (line 50))
276.5   Downloading rich-14.3.3-py3-none-any.whl.metadata (18 kB)
277.5 Collecting uncalled-for>=0.2.0 (from fastmcp>=0.2.0->-r requirements.txt (line 50))
277.6   Downloading uncalled_for-0.2.0-py3-none-any.whl.metadata (2.9 kB)   
278.6 Collecting watchfiles>=1.0.0 (from fastmcp>=0.2.0->-r requirements.txt (line 50))
278.7   Downloading watchfiles-1.1.1-cp311-cp311-manylinux_2_17_x86_64.manylinux2014_x86_64.whl.metadata (4.9 kB)
279.8 Collecting websockets>=15.0.1 (from fastmcp>=0.2.0->-r requirements.txt (line 50))
279.9   Downloading websockets-16.0-cp311-cp311-manylinux1_x86_64.manylinux_2_28_x86_64.manylinux_2_5_x86_64.whl.metadata (6.8 kB)
280.8 Collecting iniconfig>=1.0.1 (from pytest>=7.4.0->-r requirements.txt (line 62))
280.9   Downloading iniconfig-2.3.0-py3-none-any.whl.metadata (2.5 kB)      
281.7 Collecting pluggy<2,>=1.5 (from pytest>=7.4.0->-r requirements.txt (line 62))
281.9   Downloading pluggy-1.6.0-py3-none-any.whl.metadata (4.8 kB)
282.4 Collecting pygments>=2.7.2 (from pytest>=7.4.0->-r requirements.txt (line 62))
282.5   Downloading pygments-2.19.2-py3-none-any.whl.metadata (2.5 kB)      
283.1 Collecting httpcore==1.* (from httpx>=0.27.0->-r requirements.txt (line 64))
283.2   Downloading httpcore-1.0.9-py3-none-any.whl.metadata (21 kB)        
284.0 Collecting pycparser (from cffi>=2.0.0->cryptography>=41.0.0->-r requirements.txt (line 37))
284.1   Downloading pycparser-3.0-py3-none-any.whl.metadata (8.2 kB)        
284.6 Collecting docstring-parser<4.0,>=0.15 (from cyclopts>=4.0.0->fastmcp>=0.2.0->-r requirements.txt (line 50))
284.7   Downloading docstring_parser-0.17.0-py3-none-any.whl.metadata (3.5 kB)
285.2 Collecting rich-rst<2.0.0,>=1.3.1 (from cyclopts>=4.0.0->fastmcp>=0.2.0->-r requirements.txt (line 50))
285.3   Downloading rich_rst-1.3.2-py3-none-any.whl.metadata (6.1 kB)       
286.4 Collecting marshmallow<4.0.0,>=3.18.0 (from dataclasses-json<0.7.0,>=0.6.7->langchain-community>=0.0.10->-r requirements.txt (line 46))
286.5   Downloading marshmallow-3.26.2-py3-none-any.whl.metadata (7.3 kB)   
287.4 Collecting typing-inspect<1,>=0.4.0 (from dataclasses-json<0.7.0,>=0.6.7->langchain-community>=0.0.10->-r requirements.txt (line 46))
287.5   Downloading https://download.pytorch.org/whl/typing_inspect-0.9.0-py3-none-any.whl (8.8 kB)
289.1 Collecting hf-xet<2.0.0,>=1.1.3 (from huggingface-hub<1.0,>=0.34.0->transformers<5.0.0,>=4.38.0->-r requirements.txt (line 31))
289.2   Downloading hf_xet-1.4.2-cp37-abi3-manylinux2014_x86_64.manylinux_2_17_x86_64.whl.metadata (4.9 kB)
289.8 Collecting jsonschema-specifications>=2023.03.6 (from jsonschema>=4.20.0->mcp>=1.0.0->-r requirements.txt (line 49))
289.9   Downloading jsonschema_specifications-2025.9.1-py3-none-any.whl.metadata (2.9 kB)
290.9 Collecting referencing>=0.28.4 (from jsonschema>=4.20.0->mcp>=1.0.0->-r requirements.txt (line 49))
291.0   Downloading referencing-0.37.0-py3-none-any.whl.metadata (2.8 kB)   
294.7 Collecting rpds-py>=0.25.0 (from jsonschema>=4.20.0->mcp>=1.0.0->-r requirements.txt (line 49))
294.8   Downloading rpds_py-0.30.0-cp311-cp311-manylinux_2_17_x86_64.manylinux2014_x86_64.whl.metadata (4.1 kB)
295.2 Collecting pathable<0.6.0,>=0.5.0 (from jsonschema-path>=0.3.4->fastmcp>=0.2.0->-r requirements.txt (line 50))
295.3   Downloading pathable-0.5.0-py3-none-any.whl.metadata (5.9 kB)       
296.3 Collecting langchain-text-splitters<2.0.0,>=1.1.1 (from langchain-classic<2.0.0,>=1.0.0->langchain-community>=0.0.10->-r requirements.txt (line 46))
296.5   Downloading langchain_text_splitters-1.1.1-py3-none-any.whl.metadata (3.3 kB)
297.5 Collecting jsonpatch<2.0.0,>=1.33.0 (from langchain-core<2.0.0,>=1.2.10->langchain>=0.1.0->-r requirements.txt (line 43))
297.6   Downloading jsonpatch-1.33-py2.py3-none-any.whl.metadata (3.0 kB)   
299.1 Collecting uuid-utils<1.0,>=0.12.0 (from langchain-core<2.0.0,>=1.2.10->langchain>=0.1.0->-r requirements.txt (line 43))
299.2   Downloading uuid_utils-0.14.1-cp39-abi3-manylinux_2_17_x86_64.manylinux2014_x86_64.whl.metadata (4.8 kB)
300.9 Collecting ormsgpack>=1.12.0 (from langgraph-checkpoint<5.0.0,>=2.1.0->langgraph>=0.0.40->-r requirements.txt (line 44))
301.0   Downloading ormsgpack-1.12.2-cp311-cp311-manylinux_2_17_x86_64.manylinux2014_x86_64.whl.metadata (3.2 kB)
303.8 Collecting orjson>=3.11.5 (from langgraph-sdk<0.4.0,>=0.3.0->langgraph>=0.0.40->-r requirements.txt (line 44))
303.9   Downloading orjson-3.11.7-cp311-cp311-manylinux_2_17_x86_64.manylinux2014_x86_64.whl.metadata (41 kB)
304.1      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 42.0/42.0 kB 202.6 kB/s eta 0:00:00
305.0 Collecting requests-toolbelt>=1.0.0 (from langsmith<1.0.0,>=0.1.125->langchain-community>=0.0.10->-r requirements.txt (line 46))
305.2   Downloading requests_toolbelt-1.0.0-py2.py3-none-any.whl.metadata (14 kB)
306.3 Collecting zstandard>=0.23.0 (from langsmith<1.0.0,>=0.1.125->langchain-community>=0.0.10->-r requirements.txt (line 46))
306.4   Downloading zstandard-0.25.0-cp311-cp311-manylinux2014_x86_64.manylinux_2_17_x86_64.whl.metadata (3.3 kB)
307.2 Collecting importlib-metadata<8.8.0,>=6.0 (from opentelemetry-api>=1.20.0->fastmcp>=0.2.0->-r requirements.txt (line 50))
307.4   Downloading importlib_metadata-8.7.1-py3-none-any.whl.metadata (4.7 kB)
308.0 Collecting beartype>=0.20.0 (from py-key-value-aio<0.5.0,>=0.4.4->py-key-value-aio[filetree,keyring,memory]<0.5.0,>=0.4.4->fastmcp>=0.2.0->-r requirements.txt (line 50))
308.1   Downloading beartype-0.22.9-py3-none-any.whl.metadata (37 kB)       
308.9 Collecting aiofile>=3.5.0 (from py-key-value-aio[filetree,keyring,memory]<0.5.0,>=0.4.4->fastmcp>=0.2.0->-r requirements.txt (line 50))
309.0   Downloading aiofile-3.9.0-py3-none-any.whl.metadata (14 kB)
309.8 Collecting keyring>=25.6.0 (from py-key-value-aio[filetree,keyring,memory]<0.5.0,>=0.4.4->fastmcp>=0.2.0->-r requirements.txt (line 50))
309.9   Downloading keyring-25.7.0-py3-none-any.whl.metadata (21 kB)        
310.9 Collecting cachetools>=5.0.0 (from py-key-value-aio[filetree,keyring,memory]<0.5.0,>=0.4.4->fastmcp>=0.2.0->-r requirements.txt (line 50))        
311.0   Downloading cachetools-7.0.5-py3-none-any.whl.metadata (5.6 kB)     
311.5 Collecting email-validator>=2.0.0 (from pydantic[email]>=2.11.7->fastmcp>=0.2.0->-r requirements.txt (line 50))
311.6   Downloading email_validator-2.3.0-py3-none-any.whl.metadata (26 kB) 
312.8 Collecting markdown-it-py>=2.2.0 (from rich>=13.9.4->fastmcp>=0.2.0->-r requirements.txt (line 50))
312.9   Downloading markdown_it_py-4.0.0-py3-none-any.whl.metadata (7.3 kB) 
315.5 Collecting greenlet>=1 (from SQLAlchemy<3.0.0,>=1.4.0->langchain-community>=0.0.10->-r requirements.txt (line 46))
315.6   Downloading greenlet-3.3.2-cp311-cp311-manylinux_2_24_x86_64.manylinux_2_28_x86_64.whl.metadata (3.7 kB)
318.2 Collecting MarkupSafe>=2.0 (from jinja2->torch==2.5.1->-r requirements.txt (line 26))
318.3   Downloading markupsafe-3.0.3-cp311-cp311-manylinux2014_x86_64.manylinux_2_17_x86_64.manylinux_2_28_x86_64.whl.metadata (2.7 kB)
319.1 Collecting caio<0.10.0,>=0.9.0 (from aiofile>=3.5.0->py-key-value-aio[filetree,keyring,memory]<0.5.0,>=0.4.4->fastmcp>=0.2.0->-r requirements.txt (line 50))
319.2   Downloading caio-0.9.25-cp311-cp311-manylinux_2_34_x86_64.whl.metadata (3.3 kB)
319.8 Collecting dnspython>=2.0.0 (from email-validator>=2.0.0->pydantic[email]>=2.11.7->fastmcp>=0.2.0->-r requirements.txt (line 50))
319.9   Downloading dnspython-2.8.0-py3-none-any.whl.metadata (5.7 kB)      
320.9 Collecting zipp>=3.20 (from importlib-metadata<8.8.0,>=6.0->opentelemetry-api>=1.20.0->fastmcp>=0.2.0->-r requirements.txt (line 50))
321.1   Downloading zipp-3.23.0-py3-none-any.whl.metadata (3.6 kB)
322.0 Collecting jsonpointer>=1.9 (from jsonpatch<2.0.0,>=1.33.0->langchain-core<2.0.0,>=1.2.10->langchain>=0.1.0->-r requirements.txt (line 43))       
322.2   Downloading jsonpointer-3.1.1-py3-none-any.whl.metadata (2.4 kB)    
322.7 Collecting SecretStorage>=3.2 (from keyring>=25.6.0->py-key-value-aio[filetree,keyring,memory]<0.5.0,>=0.4.4->fastmcp>=0.2.0->-r requirements.txt (line 50))
322.8   Downloading secretstorage-3.5.0-py3-none-any.whl.metadata (4.0 kB)  
323.2 Collecting jeepney>=0.4.2 (from keyring>=25.6.0->py-key-value-aio[filetree,keyring,memory]<0.5.0,>=0.4.4->fastmcp>=0.2.0->-r requirements.txt (line 50))
323.3   Downloading jeepney-0.9.0-py3-none-any.whl.metadata (1.2 kB)        
324.1 Collecting jaraco.classes (from keyring>=25.6.0->py-key-value-aio[filetree,keyring,memory]<0.5.0,>=0.4.4->fastmcp>=0.2.0->-r requirements.txt (line 50))
324.2   Downloading jaraco.classes-3.4.0-py3-none-any.whl.metadata (2.6 kB) 
325.1 Collecting jaraco.functools (from keyring>=25.6.0->py-key-value-aio[filetree,keyring,memory]<0.5.0,>=0.4.4->fastmcp>=0.2.0->-r requirements.txt (line 50))
325.2   Downloading jaraco_functools-4.4.0-py3-none-any.whl.metadata (3.0 kB)
326.1 Collecting jaraco.context (from keyring>=25.6.0->py-key-value-aio[filetree,keyring,memory]<0.5.0,>=0.4.4->fastmcp>=0.2.0->-r requirements.txt (line 50))
326.2   Downloading jaraco_context-6.1.2-py3-none-any.whl.metadata (4.2 kB) 
327.1 Collecting mdurl~=0.1 (from markdown-it-py>=2.2.0->rich>=13.9.4->fastmcp>=0.2.0->-r requirements.txt (line 50))
327.2   Downloading mdurl-0.1.2-py3-none-any.whl.metadata (1.6 kB)
328.0 Collecting docutils (from rich-rst<2.0.0,>=1.3.1->cyclopts>=4.0.0->fastmcp>=0.2.0->-r requirements.txt (line 50))
328.1   Downloading docutils-0.22.4-py3-none-any.whl.metadata (15 kB)       
328.6 Collecting mypy-extensions>=0.3.0 (from typing-inspect<1,>=0.4.0->dataclasses-json<0.7.0,>=0.6.7->langchain-community>=0.0.10->-r requirements.txt (line 46))
328.7   Downloading mypy_extensions-1.1.0-py3-none-any.whl.metadata (1.1 kB)
330.0 Collecting more-itertools (from jaraco.classes->keyring>=25.6.0->py-key-value-aio[filetree,keyring,memory]<0.5.0,>=0.4.4->fastmcp>=0.2.0->-r requirements.txt (line 50))
330.1   Downloading more_itertools-10.8.0-py3-none-any.whl.metadata (39 kB)
331.2 Collecting backports.tarfile (from jaraco.context->keyring>=25.6.0->py-key-value-aio[filetree,keyring,memory]<0.5.0,>=0.4.4->fastmcp>=0.2.0->-r requirements.txt (line 50))
331.3   Downloading backports.tarfile-1.2.0-py3-none-any.whl.metadata (2.0 kB)
331.7 Downloading sympy-1.13.1-py3-none-any.whl (6.2 MB)
365.6    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 6.2/6.2 MB 186.1 kB/s eta 0:00:00
365.7 Downloading fastapi-0.135.2-py3-none-any.whl (117 kB)
366.2    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 117.4/117.4 kB 220.3 kB/s eta 0:00:00
366.3 Downloading uvicorn-0.42.0-py3-none-any.whl (68 kB)
366.7    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 68.8/68.8 kB 224.4 kB/s eta 0:00:00
366.8 Downloading aiohttp-3.13.3-cp311-cp311-manylinux2014_x86_64.manylinux_2_17_x86_64.manylinux_2_28_x86_64.whl (1.7 MB)
376.6    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 1.7/1.7 MB 178.1 kB/s eta 0:00:00
376.7 Downloading requests-2.32.5-py3-none-any.whl (64 kB)
377.0    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 64.7/64.7 kB 291.7 kB/s eta 0:00:00
377.2 Downloading pydantic-2.12.5-py3-none-any.whl (463 kB)
379.7    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 463.6/463.6 kB 185.2 kB/s eta 0:00:00
379.8 Downloading pydantic_core-2.41.5-cp311-cp311-manylinux_2_17_x86_64.manylinux2014_x86_64.whl (2.1 MB)
391.1    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 2.1/2.1 MB 182.2 kB/s eta 0:00:00
391.3 Downloading python_dateutil-2.9.0.post0-py2.py3-none-any.whl (229 kB) 
392.6    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 229.9/229.9 kB 178.5 kB/s eta 0:00:00
392.7 Downloading pandas-3.0.1-cp311-cp311-manylinux_2_24_x86_64.manylinux_2_28_x86_64.whl (11.3 MB)
449.2    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 11.3/11.3 MB 195.1 kB/s eta 0:00:00
449.3 Downloading numpy-2.4.3-cp311-cp311-manylinux_2_27_x86_64.manylinux_2_28_x86_64.whl (16.9 MB)
526.6    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 16.9/16.9 MB 214.2 kB/s eta 0:00:00
526.8 Downloading lightgbm-4.6.0-py3-none-manylinux_2_28_x86_64.whl (3.6 MB)
547.7    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 3.6/3.6 MB 171.1 kB/s eta 0:00:00
547.8 Downloading scikit_learn-1.8.0-cp311-cp311-manylinux_2_27_x86_64.manylinux_2_28_x86_64.whl (9.1 MB)
590.0    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 9.1/9.1 MB 215.7 kB/s eta 0:00:00
590.2 Downloading transformers-4.57.6-py3-none-any.whl (12.0 MB)
639.9    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 12.0/12.0 MB 241.7 kB/s eta 0:00:00
640.0 Downloading sentencepiece-0.2.1-cp311-cp311-manylinux_2_27_x86_64.manylinux_2_28_x86_64.whl (1.4 MB)
645.3    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 1.4/1.4 MB 261.2 kB/s eta 0:00:00
645.5 Downloading peft-0.18.1-py3-none-any.whl (556 kB)
649.0    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 557.0/557.0 kB 156.8 kB/s eta 0:00:00
649.1 Downloading pyjwt-2.12.1-py3-none-any.whl (29 kB)
649.4 Downloading cryptography-46.0.5-cp311-abi3-manylinux_2_34_x86_64.whl (4.5 MB)
672.7    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 4.5/4.5 MB 192.4 kB/s eta 0:00:00
672.8 Downloading openai-2.29.0-py3-none-any.whl (1.1 MB)
676.8    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 1.1/1.1 MB 287.1 kB/s eta 0:00:00
676.9 Downloading langchain-1.2.13-py3-none-any.whl (112 kB)
677.2    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 112.5/112.5 kB 379.6 kB/s eta 0:00:00
677.3 Downloading langgraph-1.1.3-py3-none-any.whl (168 kB)
677.8    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 168.1/168.1 kB 394.4 kB/s eta 0:00:00
677.9 Downloading langchain_openai-1.1.12-py3-none-any.whl (88 kB)
678.1    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 88.5/88.5 kB 343.3 kB/s eta 0:00:00
678.2 Downloading langchain_community-0.4.1-py3-none-any.whl (2.5 MB)       
688.6    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 2.5/2.5 MB 243.9 kB/s eta 0:00:00
688.7 Downloading mcp-1.26.0-py3-none-any.whl (233 kB)
690.2    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 233.6/233.6 kB 166.3 kB/s eta 0:00:00
690.3 Downloading fastmcp-3.1.1-py3-none-any.whl (633 kB)
693.9    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 633.8/633.8 kB 176.5 kB/s eta 0:00:00
694.0 Downloading python_dotenv-1.2.2-py3-none-any.whl (22 kB)
694.3 Downloading pydantic_settings-2.13.1-py3-none-any.whl (58 kB)
694.9    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 58.9/58.9 kB 127.5 kB/s eta 0:00:00
695.0 Downloading structlog-25.5.0-py3-none-any.whl (72 kB)
695.5    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 72.5/72.5 kB 156.1 kB/s eta 0:00:00
695.6 Downloading pytest-9.0.2-py3-none-any.whl (374 kB)
697.4    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 374.8/374.8 kB 224.1 kB/s eta 0:00:00
697.5 Downloading pytest_asyncio-1.3.0-py3-none-any.whl (15 kB)
697.6 Downloading httpx-0.28.1-py3-none-any.whl (73 kB)
698.0    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 73.5/73.5 kB 243.9 kB/s eta 0:00:00
698.1 Downloading httpcore-1.0.9-py3-none-any.whl (78 kB)
698.4    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 78.8/78.8 kB 261.0 kB/s eta 0:00:00
698.5 Downloading accelerate-1.13.0-py3-none-any.whl (383 kB)
699.8    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 383.7/383.7 kB 294.9 kB/s eta 0:00:00
699.9 Downloading aiohappyeyeballs-2.6.1-py3-none-any.whl (15 kB)
700.1 Downloading aiosignal-1.4.0-py3-none-any.whl (7.5 kB)
700.3 Downloading annotated_doc-0.0.4-py3-none-any.whl (5.3 kB)
700.4 Downloading annotated_types-0.7.0-py3-none-any.whl (13 kB)
700.5 Downloading anyio-4.13.0-py3-none-any.whl (114 kB)
701.1    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 114.4/114.4 kB 209.4 kB/s eta 0:00:00
701.3 Downloading attrs-26.1.0-py3-none-any.whl (67 kB)
701.6    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 67.5/67.5 kB 210.4 kB/s eta 0:00:00
701.7 Downloading authlib-1.6.9-py2.py3-none-any.whl (244 kB)
702.8    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 244.2/244.2 kB 244.8 kB/s eta 0:00:00
702.9 Downloading certifi-2026.2.25-py3-none-any.whl (153 kB)
703.4    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 153.7/153.7 kB 271.9 kB/s eta 0:00:00
703.5 Downloading cffi-2.0.0-cp311-cp311-manylinux2014_x86_64.manylinux_2_17_x86_64.whl (215 kB)
704.7    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 215.6/215.6 kB 187.3 kB/s eta 0:00:00
704.8 Downloading charset_normalizer-3.4.6-cp311-cp311-manylinux2014_x86_64.manylinux_2_17_x86_64.manylinux_2_28_x86_64.whl (204 kB)
705.9    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 204.7/204.7 kB 199.6 kB/s eta 0:00:00
706.0 Downloading click-8.3.1-py3-none-any.whl (108 kB)
706.5    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 108.3/108.3 kB 205.5 kB/s eta 0:00:00
706.6 Downloading cyclopts-4.10.1-py3-none-any.whl (204 kB)
707.6    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 204.3/204.3 kB 227.1 kB/s eta 0:00:00
707.7 Downloading dataclasses_json-0.6.7-py3-none-any.whl (28 kB)
707.9 Downloading distro-1.9.0-py3-none-any.whl (20 kB)
708.0 Downloading exceptiongroup-1.3.1-py3-none-any.whl (16 kB)
708.2 Downloading frozenlist-1.8.0-cp311-cp311-manylinux1_x86_64.manylinux_2_28_x86_64.manylinux_2_5_x86_64.whl (231 kB)
709.0    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 231.1/231.1 kB 289.6 kB/s eta 0:00:00
709.1 Downloading h11-0.16.0-py3-none-any.whl (37 kB)
709.4 Downloading httpx_sse-0.4.3-py3-none-any.whl (9.0 kB)
709.6 Downloading huggingface_hub-0.36.2-py3-none-any.whl (566 kB)
711.8    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 566.4/566.4 kB 256.1 kB/s eta 0:00:00
711.9 Downloading fsspec-2026.2.0-py3-none-any.whl (202 kB)
713.1    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 202.5/202.5 kB 165.3 kB/s eta 0:00:00
713.2 Downloading idna-3.11-py3-none-any.whl (71 kB)
713.7    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 71.0/71.0 kB 163.0 kB/s eta 0:00:00
713.8 Downloading iniconfig-2.3.0-py3-none-any.whl (7.5 kB)
714.0 Downloading jiter-0.13.0-cp311-cp311-manylinux_2_17_x86_64.manylinux2014_x86_64.whl (362 kB)
715.8    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 362.7/362.7 kB 204.2 kB/s eta 0:00:00
715.9 Downloading joblib-1.5.3-py3-none-any.whl (309 kB)
717.1    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 309.1/309.1 kB 260.7 kB/s eta 0:00:00
717.2 Downloading jsonref-1.1.0-py3-none-any.whl (9.4 kB)
717.3 Downloading jsonschema-4.26.0-py3-none-any.whl (90 kB)
717.7    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 90.6/90.6 kB 294.3 kB/s eta 0:00:00
717.8 Downloading jsonschema_path-0.4.5-py3-none-any.whl (19 kB)
717.9 Downloading langchain_classic-1.0.3-py3-none-any.whl (1.0 MB)
721.1    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 1.0/1.0 MB 330.4 kB/s eta 0:00:00
721.2 Downloading langchain_core-1.2.22-py3-none-any.whl (506 kB)
723.5    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 506.8/506.8 kB 220.5 kB/s eta 0:00:00
723.6 Downloading langgraph_checkpoint-4.0.1-py3-none-any.whl (50 kB)       
723.8    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 50.5/50.5 kB 241.2 kB/s eta 0:00:00
723.9 Downloading langgraph_prebuilt-1.0.8-py3-none-any.whl (35 kB)
724.2 Downloading langgraph_sdk-0.3.12-py3-none-any.whl (95 kB)
724.6    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 95.8/95.8 kB 241.1 kB/s eta 0:00:00
724.7 Downloading langsmith-0.7.22-py3-none-any.whl (359 kB)
726.1    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 359.9/359.9 kB 261.8 kB/s eta 0:00:00
726.2 Downloading multidict-6.7.1-cp311-cp311-manylinux2014_x86_64.manylinux_2_17_x86_64.manylinux_2_28_x86_64.whl (246 kB)
727.4    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 246.3/246.3 kB 213.2 kB/s eta 0:00:00
727.5 Downloading openapi_pydantic-0.5.1-py3-none-any.whl (96 kB)
728.0    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 96.4/96.4 kB 207.3 kB/s eta 0:00:00
728.1 Downloading opentelemetry_api-1.40.0-py3-none-any.whl (68 kB)
728.4    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 68.7/68.7 kB 231.0 kB/s eta 0:00:00
728.5 Downloading packaging-26.0-py3-none-any.whl (74 kB)
728.8    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 74.4/74.4 kB 263.7 kB/s eta 0:00:00
728.9 Downloading pillow-12.1.1-cp311-cp311-manylinux_2_27_x86_64.manylinux_2_28_x86_64.whl (7.0 MB)
761.6    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 7.0/7.0 MB 216.3 kB/s eta 0:00:00
761.7 Downloading platformdirs-4.9.4-py3-none-any.whl (21 kB)
761.9 Downloading pluggy-1.6.0-py3-none-any.whl (20 kB)
762.0 Downloading propcache-0.4.1-cp311-cp311-manylinux2014_x86_64.manylinux_2_17_x86_64.manylinux_2_28_x86_64.whl (210 kB)
762.8    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 210.0/210.0 kB 295.2 kB/s eta 0:00:00
762.9 Downloading py_key_value_aio-0.4.4-py3-none-any.whl (152 kB)
763.6    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 152.3/152.3 kB 227.4 kB/s eta 0:00:00
763.7 Downloading pygments-2.19.2-py3-none-any.whl (1.2 MB)
768.6    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 1.2/1.2 MB 247.4 kB/s eta 0:00:00
768.7 Downloading pyperclip-1.11.0-py3-none-any.whl (11 kB)
768.9 Downloading python_multipart-0.0.22-py3-none-any.whl (24 kB)
769.0 Downloading pyyaml-6.0.3-cp311-cp311-manylinux2014_x86_64.manylinux_2_17_x86_64.manylinux_2_28_x86_64.whl (806 kB)
771.8    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 806.6/806.6 kB 288.8 kB/s eta 0:00:00
771.9 Downloading regex-2026.2.28-cp311-cp311-manylinux2014_x86_64.manylinux_2_17_x86_64.manylinux_2_28_x86_64.whl (800 kB)
775.3    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 800.2/800.2 kB 236.3 kB/s eta 0:00:00
775.4 Downloading rich-14.3.3-py3-none-any.whl (310 kB)
777.0    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 310.5/310.5 kB 203.2 kB/s eta 0:00:00
777.1 Downloading safetensors-0.7.0-cp38-abi3-manylinux_2_17_x86_64.manylinux2014_x86_64.whl (507 kB)
779.8    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 507.2/507.2 kB 188.8 kB/s eta 0:00:00
779.9 Downloading scipy-1.17.1-cp311-cp311-manylinux_2_27_x86_64.manylinux_2_28_x86_64.whl (35.3 MB)
1542.2    ━━━━━━━━━━━━━━━━━━━╸                     17.3/35.3 MB 206.5 kB/s eta 0:01:28
1546.0 Downloading six-1.17.0-py2.py3-none-any.whl (11 kB)
1546.1 Downloading sqlalchemy-2.0.48-cp311-cp311-manylinux2014_x86_64.manylinux_2_17_x86_64.manylinux_2_28_x86_64.whl (3.3 MB)
1548.4    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 3.3/3.3 MB 1.5 MB/s eta 0:00:00
1548.5 Downloading sse_starlette-3.3.3-py3-none-any.whl (14 kB)
1548.6 Downloading starlette-1.0.0-py3-none-any.whl (72 kB)
1548.7    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 72.7/72.7 kB 1.9 MB/s eta 0:00:00
1548.8 Downloading tenacity-9.1.4-py3-none-any.whl (28 kB)
1548.9 Downloading threadpoolctl-3.6.0-py3-none-any.whl (18 kB)
1549.0 Downloading tiktoken-0.12.0-cp311-cp311-manylinux_2_28_x86_64.whl (1.2 MB)
1550.1    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 1.2/1.2 MB 1.0 MB/s eta 0:00:00
1550.3 Downloading tokenizers-0.22.2-cp39-abi3-manylinux_2_17_x86_64.manylinux2014_x86_64.whl (3.3 MB)
1558.5    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 3.3/3.3 MB 396.7 kB/s eta 0:00:00
1558.7 Downloading tqdm-4.67.3-py3-none-any.whl (78 kB)
1558.8    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 78.4/78.4 kB 479.7 kB/s eta 0:00:00
1559.5 Downloading https://download.pytorch.org/whl/typing_extensions-4.15.0-py3-none-any.whl (44 kB)
1559.7    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 44.6/44.6 kB 237.8 kB/s eta 0:00:00
1559.9 Downloading typing_inspection-0.4.2-py3-none-any.whl (14 kB)
1560.1 Downloading uncalled_for-0.2.0-py3-none-any.whl (11 kB)
1560.2 Downloading urllib3-2.6.3-py3-none-any.whl (131 kB)
1560.7    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 131.6/131.6 kB 371.5 kB/s eta 0:00:00
1560.8 Downloading watchfiles-1.1.1-cp311-cp311-manylinux_2_17_x86_64.manylinux2014_x86_64.whl (456 kB)
1562.2    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 456.1/456.1 kB 329.0 kB/s eta 0:00:00
1562.4 Downloading websockets-16.0-cp311-cp311-manylinux1_x86_64.manylinux_2_28_x86_64.manylinux_2_5_x86_64.whl (184 kB)
1562.7    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 184.6/184.6 kB 497.3 kB/s eta 0:00:00
1563.0 Downloading xxhash-3.6.0-cp311-cp311-manylinux2014_x86_64.manylinux_2_17_x86_64.manylinux_2_28_x86_64.whl (193 kB)
1563.5    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 193.9/193.9 kB 685.3 kB/s eta 0:00:00
1563.7 Downloading yarl-1.23.0-cp311-cp311-manylinux2014_x86_64.manylinux_2_17_x86_64.manylinux_2_28_x86_64.whl (102 kB)
1563.9    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 102.7/102.7 kB 541.5 kB/s eta 0:00:00
1564.0 Downloading filelock-3.25.2-py3-none-any.whl (26 kB)
1564.2 Downloading https://download.pytorch.org/whl/jinja2-3.1.6-py3-none-any.whl (134 kB)
1564.3    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 134.9/134.9 kB 1.0 MB/s eta 0:00:00
1564.5 Downloading networkx-3.6.1-py3-none-any.whl (2.1 MB)
1569.1    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 2.1/2.1 MB 458.7 kB/s eta 0:00:00
1569.2 Downloading psutil-7.2.2-cp36-abi3-manylinux2010_x86_64.manylinux_2_12_x86_64.manylinux_2_28_x86_64.whl (155 kB)
1569.6    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 155.6/155.6 kB 446.6 kB/s eta 0:00:00
1569.7 Downloading sniffio-1.3.1-py3-none-any.whl (10 kB)
1569.8 Downloading aiofile-3.9.0-py3-none-any.whl (19 kB)
1570.0 Downloading beartype-0.22.9-py3-none-any.whl (1.3 MB)
1572.7    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 1.3/1.3 MB 492.6 kB/s eta 0:00:00
1572.8 Downloading cachetools-7.0.5-py3-none-any.whl (13 kB)
1573.1 Downloading docstring_parser-0.17.0-py3-none-any.whl (36 kB)
1573.4 Downloading email_validator-2.3.0-py3-none-any.whl (35 kB)
1573.5 Downloading greenlet-3.3.2-cp311-cp311-manylinux_2_24_x86_64.manylinux_2_28_x86_64.whl (594 kB)
1574.8    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 594.2/594.2 kB 496.1 kB/s eta 0:00:00
1574.9 Downloading hf_xet-1.4.2-cp37-abi3-manylinux2014_x86_64.manylinux_2_17_x86_64.whl (4.2 MB)
1584.2    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 4.2/4.2 MB 453.6 kB/s eta 0:00:00
1584.3 Downloading importlib_metadata-8.7.1-py3-none-any.whl (27 kB)        
1584.5 Downloading jsonpatch-1.33-py2.py3-none-any.whl (12 kB)
1584.6 Downloading jsonschema_specifications-2025.9.1-py3-none-any.whl (18 kB)
1584.7 Downloading keyring-25.7.0-py3-none-any.whl (39 kB)
1584.9 Downloading langchain_text_splitters-1.1.1-py3-none-any.whl (35 kB)  
1585.1 Downloading markdown_it_py-4.0.0-py3-none-any.whl (87 kB)
1585.3    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 87.3/87.3 kB 456.6 kB/s eta 0:00:00
1585.5 Downloading markupsafe-3.0.3-cp311-cp311-manylinux2014_x86_64.manylinux_2_17_x86_64.manylinux_2_28_x86_64.whl (22 kB)
1585.6 Downloading marshmallow-3.26.2-py3-none-any.whl (50 kB)
1585.7    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 51.0/51.0 kB 493.1 kB/s eta 0:00:00
1585.8 Downloading mpmath-1.3.0-py3-none-any.whl (536 kB)
1587.1    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 536.2/536.2 kB 420.8 kB/s eta 0:00:00
1587.2 Downloading orjson-3.11.7-cp311-cp311-manylinux_2_17_x86_64.manylinux2014_x86_64.whl (133 kB)
1587.6    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 133.4/133.4 kB 391.0 kB/s eta 0:00:00
1587.7 Downloading ormsgpack-1.12.2-cp311-cp311-manylinux_2_17_x86_64.manylinux2014_x86_64.whl (212 kB)
1588.2    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 212.4/212.4 kB 426.1 kB/s eta 0:00:00
1588.3 Downloading pathable-0.5.0-py3-none-any.whl (16 kB)
1588.4 Downloading referencing-0.37.0-py3-none-any.whl (26 kB)
1588.6 Downloading requests_toolbelt-1.0.0-py2.py3-none-any.whl (54 kB)     
1588.7    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 54.5/54.5 kB 524.3 kB/s eta 0:00:00
1588.8 Downloading rich_rst-1.3.2-py3-none-any.whl (12 kB)
1589.0 Downloading rpds_py-0.30.0-cp311-cp311-manylinux_2_17_x86_64.manylinux2014_x86_64.whl (390 kB)
1589.9    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 390.8/390.8 kB 434.3 kB/s eta 0:00:00
1590.0 Downloading uuid_utils-0.14.1-cp39-abi3-manylinux_2_17_x86_64.manylinux2014_x86_64.whl (345 kB)
1590.6    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 345.7/345.7 kB 532.2 kB/s eta 0:00:00
1590.7 Downloading zstandard-0.25.0-cp311-cp311-manylinux2014_x86_64.manylinux_2_17_x86_64.whl (5.6 MB)
1605.2    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 5.6/5.6 MB 383.4 kB/s eta 0:00:00
1605.3 Downloading pycparser-3.0-py3-none-any.whl (48 kB)
1605.5    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 48.2/48.2 kB 316.4 kB/s eta 0:00:00
1605.6 Downloading caio-0.9.25-cp311-cp311-manylinux_2_34_x86_64.whl (78 kB)
1606.0    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 78.3/78.3 kB 351.3 kB/s eta 0:00:00
1606.1 Downloading dnspython-2.8.0-py3-none-any.whl (331 kB)
1607.5    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 331.1/331.1 kB 246.2 kB/s eta 0:00:00
1607.6 Downloading jeepney-0.9.0-py3-none-any.whl (49 kB)
1607.7    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 49.0/49.0 kB 353.4 kB/s eta 0:00:00
1607.8 Downloading jsonpointer-3.1.1-py3-none-any.whl (7.7 kB)
1608.0 Downloading mdurl-0.1.2-py3-none-any.whl (10.0 kB)
1608.1 Downloading mypy_extensions-1.1.0-py3-none-any.whl (5.0 kB)
1608.2 Downloading secretstorage-3.5.0-py3-none-any.whl (15 kB)
1608.4 Downloading zipp-3.23.0-py3-none-any.whl (10 kB)
1608.5 Downloading docutils-0.22.4-py3-none-any.whl (633 kB)
1611.8    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 633.2/633.2 kB 193.4 kB/s eta 0:00:00
1611.9 Downloading jaraco.classes-3.4.0-py3-none-any.whl (6.8 kB)
1612.0 Downloading jaraco_context-6.1.2-py3-none-any.whl (7.9 kB)
1612.2 Downloading jaraco_functools-4.4.0-py3-none-any.whl (10 kB)
1612.3 Downloading backports.tarfile-1.2.0-py3-none-any.whl (30 kB)
1612.6 Downloading more_itertools-10.8.0-py3-none-any.whl (69 kB)
1612.9    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 69.7/69.7 kB 206.8 kB/s eta 0:00:00
1613.6 ERROR: THESE PACKAGES DO NOT MATCH THE HASHES FROM THE REQUIREMENTS FILE. If you have updated the package versions, please update the hashes. Otherwise, examine the package contents carefully; someone may have tampered with them.
1613.6     unknown package:
1613.6         Expected sha256 43af8d1f3bea642559019edfe64e9b11192a8978efbd1539d7bc2aaa23d92de4
1613.6              Got        33969a9abe7ac74ea95ca0160cd63ab4d581eb54bc81d4e5c494edd17a82ce7d
1613.6
1614.4
1614.4 [notice] A new release of pip is available: 24.0 -> 26.0.1
1614.4 [notice] To update, run: pip install --upgrade pip
------
Dockerfile:9

--------------------

   7 |

   8 |     # 安装Python依赖

   9 | >>> RUN pip install --no-cache-dir -r requirements.txt

  10 |

  11 |     # 复制应用代码

--------------------

target recommendation-service: failed to solve: process "/bin/sh -c pip install --no-cache-dir -r requirements.txt" did not complete successfully: exit code: 1

PS D:\FoodMate-AI\backend>