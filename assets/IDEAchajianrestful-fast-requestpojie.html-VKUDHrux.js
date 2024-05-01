import{_ as e,o as a,c as s,e as t}from"./app-vMCaIZpZ.js";const i="/assets/Pasted_image_20231231214459-psyhXMb2.png",n="/assets/Pasted_image_20231231211127-kgczYOD9.png",c="/assets/Pasted_image_20231231200327-vur_XTnG.png",l="/assets/Pasted_image_20231231212621-h41cuYG_.png",r="/assets/Pasted_image_20231231212745-tyfTpeiS.png",d="/assets/Pasted_image_20231231213518-Em69WSlx.png",o={},p=t('<h1 id="idea插件-restful-fast-request-破解" tabindex="-1"><a class="header-anchor" href="#idea插件-restful-fast-request-破解" aria-hidden="true">#</a> IDEA插件 restful-fast-request 破解</h1><p>使用 <code>ja-netfilter.jar</code> 激活 fastRequest 后仍然无法正常使用，绿色的发包按钮不可以单击 刚打开 IDEA 初始化的时候会有第二层的 key 校验，如果不通过会有以下提示： <img src="'+i+'" alt=""></p><p>经过测试，离线状态下发现不会弹出此提示，所以应该是在线判断 给IDEA挂代理，重新打开IDEA抓包，发现了可疑的请求和返回：</p><p>而且发现将此返回值从0改为1后即可不会弹出 <img src="'+n+`" alt=""></p><p>请求包：</p><div class="language-text line-numbers-mode" data-ext="text"><pre class="language-text"><code>POST /c/l HTTP/1.1
Accept: text/html,application/json,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.142 Safari/537.36 Hutool
Accept-Encoding: gzip, deflate, br
Accept-Language: zh-CN,zh;q=0.8
Content-Type: application/x-www-form-urlencoded;charset=UTF-8
Cache-Control: no-cache
Pragma: no-cache
Host: 116.62.33.138:8080
Connection: keep-alive
Content-Length: 2665

c=key%3A.......&amp;t=1
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p><img src="`+c+'" alt=""></p><h2 id="定位代码逻辑" tabindex="-1"><a class="header-anchor" href="#定位代码逻辑" aria-hidden="true">#</a> 定位代码逻辑</h2><p>通过&quot;t&quot;字符串，找到这个发包的代码处理逻辑： <img src="'+l+'" alt=""></p><h2 id="破解" tabindex="-1"><a class="header-anchor" href="#破解" aria-hidden="true">#</a> 破解</h2><p>类名为：<code>l1II1l1Il1lI1l111l1I</code></p><p>把里面的函数返回值设置为true即可，这里使用 Recaf 来修改</p><p><img src="'+r+'" alt="">修改完后导出jar包，改名替换原来的jar包</p><p>重启IDEA，可以看到绿色的发包可以单击，破解成功 <img src="'+d+'" alt=""></p><p>在整个过程中，最花时间的是如何定位到目标代码逻辑，因为类名方法名都是混淆过后的，需要根据一些参考信息来确定位置。</p><p>一开始定位到其他函数里，后续修改后发现没有生效，最后才定位到真正的逻辑，根据代码逻辑和插件的行为，确定了这里是在线检测激活的地方。</p>',16),m=[p];function u(_,h){return a(),s("div",null,m)}const g=e(o,[["render",u],["__file","IDEAchajianrestful-fast-requestpojie.html.vue"]]);export{g as default};
