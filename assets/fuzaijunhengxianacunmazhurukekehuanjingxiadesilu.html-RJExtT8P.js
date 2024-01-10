import{_ as p,r as e,o,c as i,b as n,d as s,a as c,e as a}from"./app-QhpvrKxA.js";const l="/assets/Pasted_image_20240110234426-o8aCZTNM.png",u="/assets/Pasted_image_20240110234919-YeSvdSee.png",r="/assets/Pasted_image_20240111001204-OlFrsbwz.png",d="/assets/Pasted_image_20240111002518-RJdxn7Kd.png",k="/assets/Pasted_image_20240111003450-NsuYo_D8.png",v="/assets/Pasted_image_20240111004540-el7QAgsm.png",m="/assets/Pasted_image_20240111005005-rUiVwPry.png",b="/assets/Pasted_image_20240111005115-5qpAVqsr.png",h="/assets/Pasted_image_20240111005359-QwEf4q-E.png",_="/assets/Pasted_image_20240111005636-uLdt2EsG.png",g="/assets/Pasted_image_20240111010952-wwRCGztj.png",f={},y=a('<h1 id="负载均衡下内存马注入苛刻环境下的思路" tabindex="-1"><a class="header-anchor" href="#负载均衡下内存马注入苛刻环境下的思路" aria-hidden="true">#</a> 负载均衡下内存马注入苛刻环境下的思路</h1><p>在攻防演习中，现在的内存马已经成为了很重要的一个突破入口的手段。</p><p>实战中比较简单的情况是没有任何负载，通过防火墙映射的端口直接访问到目标站点，这样的情况，如果目标站点有Java漏洞，注入内存马后直接可以访问 <img src="'+l+'" alt=""></p><p>可实战中很多情况下，目标环境比较复杂，例如微服务架构+负载均衡，简化拓扑图如下： <img src="'+u+`" alt=""></p><p>Nginx 通过 upstream 配置参数，指定三台node服务器为上游代理，也就是负载均衡。</p><div class="language-text line-numbers-mode" data-ext="text"><pre class="language-text"><code>upstream backserver {
	server node1;
	server node2;
	server node3;
}
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>Nginx支持五种负载策略，默认负载策略为轮询，即每个请求按照时间顺序轮流分配给的后端服务器。</p><p>有了负载均衡，这种情况下对我们的内存马有比较大的影响。比如实战中经常会发现注入内存马成功后，有时候能连上，有时候连不上。</p><p>针对负载均衡下内存马注入的第一种解决办法是多注入几次。</p><p>大家肯定都尝试过，值得注意的是，可以在注马时的字节码加一些判断条件，比如检测到内存马的类名已存在，就跳过注入，减少重复注入的马对目标服务器带来的压力，减少服务崩溃的风险。</p><h2 id="情况一-注入全部内存马" tabindex="-1"><a class="header-anchor" href="#情况一-注入全部内存马" aria-hidden="true">#</a> 情况一：注入全部内存马</h2><p>这种方式下最好的情况是每个负载后面的服务都能正常注入内存马，以上面的图举例，假设现在三台已经都注入成功了内存马，后端服务也均实现了session共享，这种运气比较好的情况下godzilla是能够正常连接的。</p><p>但是如果后端服务没有实现session共享，就会出现问题，godzilla的连接会出现大概率连不上的问题。</p><p>这是因为godzilla的连接需要两个包，而两个包需要会被负载均衡的策略分配到不同的应用，导致第二个包请求服务端时无法获取到大马的情况 <img src="`+r+'" alt=""></p><p>这种情况下眼睁睁看着都有🐎儿了，但是不听咱们的使唤，如何解决呢？</p>',15),w={href:"https://mp.weixin.qq.com/s/4Bmz_fuu0yrLMK1oBKKtRA",target:"_blank",rel:"noopener noreferrer"},T=a('<p>简单总结一下：</p><ol><li>给所有的应用服务上特殊的webshell</li><li>连接webshell时指定一个内网webshell的URL，把所有的流量都转发给它</li></ol><p>如下图所示 <img src="'+d+'" alt=""> 相当于我们手动实现了一个反负载均衡的操作，把所有流量都聚集在一个节点中</p><p>这样做就保证了执行webshell操作时，只会在node2上进行操作，不会因为负载均衡儿受到干扰。</p><h2 id="情况二-无法全部注入" tabindex="-1"><a class="header-anchor" href="#情况二-无法全部注入" aria-hidden="true">#</a> 情况二：无法全部注入</h2><p>实战环境下往往是奇葩的，令人头疼的。</p><p>注马的时候可能总有那么一两个节点无法注入成功，或者只能一个节点能注入成功。</p><p>在这种条件下，上面的解决方法就失效了。</p><p>把目标站点看作盲盒，既然有的时候访问会成功，有的时候会访问失败，那么在连接软件后面加入一个重传机制就好了 <img src="'+k+`" alt=""></p><p>失误重传，通过一定的规则，来确保目标返回正确的内容。 例如目标站点响应码返回不是200，就进行重传，直到目标站点返回200即可。</p><p>使用python2简单写了个demo</p><div class="language-python line-numbers-mode" data-ext="py"><pre class="language-python"><code><span class="token comment">#!/usr/bin/env python3</span>
<span class="token comment"># coding = utf-8</span>
<span class="token comment"># Time   : 2023/6/5 15:41</span>
<span class="token comment"># Author : Ar3h</span>

<span class="token keyword">from</span> BaseHTTPServer <span class="token keyword">import</span> BaseHTTPRequestHandler<span class="token punctuation">,</span> HTTPServer
<span class="token keyword">import</span> socket
<span class="token keyword">import</span> urllib


<span class="token keyword">class</span> <span class="token class-name">MyHandler</span><span class="token punctuation">(</span>BaseHTTPRequestHandler<span class="token punctuation">)</span><span class="token punctuation">:</span>

    <span class="token keyword">def</span> <span class="token function">do_POST</span><span class="token punctuation">(</span>self<span class="token punctuation">)</span><span class="token punctuation">:</span>
        uri <span class="token operator">=</span> self<span class="token punctuation">.</span>path
        <span class="token comment"># print uri</span>
        proto<span class="token punctuation">,</span> rest <span class="token operator">=</span> urllib<span class="token punctuation">.</span>splittype<span class="token punctuation">(</span>uri<span class="token punctuation">)</span>
        host<span class="token punctuation">,</span> rest <span class="token operator">=</span> urllib<span class="token punctuation">.</span>splithost<span class="token punctuation">(</span>rest<span class="token punctuation">)</span>
        <span class="token comment"># print host</span>
        path <span class="token operator">=</span> rest
        host<span class="token punctuation">,</span> port <span class="token operator">=</span> urllib<span class="token punctuation">.</span>splitnport<span class="token punctuation">(</span>host<span class="token punctuation">)</span>
        <span class="token keyword">if</span> port <span class="token operator">&lt;</span> <span class="token number">0</span><span class="token punctuation">:</span>
            port <span class="token operator">=</span> <span class="token number">80</span>
        <span class="token comment"># print host</span>
        host_ip <span class="token operator">=</span> socket<span class="token punctuation">.</span>gethostbyname<span class="token punctuation">(</span>host<span class="token punctuation">)</span>
        <span class="token comment"># print port</span>

        <span class="token keyword">del</span> self<span class="token punctuation">.</span>headers<span class="token punctuation">[</span><span class="token string">&#39;Proxy-Connection&#39;</span><span class="token punctuation">]</span>
        self<span class="token punctuation">.</span>headers<span class="token punctuation">[</span><span class="token string">&#39;Connection&#39;</span><span class="token punctuation">]</span> <span class="token operator">=</span> <span class="token string">&#39;close&#39;</span>

        send_data <span class="token operator">=</span> <span class="token string">&#39;POST &#39;</span> <span class="token operator">+</span> path <span class="token operator">+</span> <span class="token string">&#39; &#39;</span> <span class="token operator">+</span> self<span class="token punctuation">.</span>protocol_version <span class="token operator">+</span> <span class="token string">&#39;\\r\\n&#39;</span>
        head <span class="token operator">=</span> <span class="token string">&#39;&#39;</span>
        <span class="token keyword">for</span> key<span class="token punctuation">,</span> val <span class="token keyword">in</span> self<span class="token punctuation">.</span>headers<span class="token punctuation">.</span>items<span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">:</span>
            head <span class="token operator">=</span> head <span class="token operator">+</span> <span class="token string">&quot;%s: %s\\r\\n&quot;</span> <span class="token operator">%</span> <span class="token punctuation">(</span>key<span class="token punctuation">,</span> val<span class="token punctuation">)</span>
        send_data <span class="token operator">=</span> send_data <span class="token operator">+</span> head <span class="token operator">+</span> <span class="token string">&#39;\\r\\n&#39;</span>

        content_length <span class="token operator">=</span> <span class="token builtin">int</span><span class="token punctuation">(</span>self<span class="token punctuation">.</span>headers<span class="token punctuation">[</span><span class="token string">&#39;Content-Length&#39;</span><span class="token punctuation">]</span><span class="token punctuation">)</span>
        post_data <span class="token operator">=</span> self<span class="token punctuation">.</span>rfile<span class="token punctuation">.</span>read<span class="token punctuation">(</span>content_length<span class="token punctuation">)</span>
        <span class="token comment"># print(post_data)</span>

        send_data <span class="token operator">=</span> send_data <span class="token operator">+</span> post_data
        <span class="token keyword">print</span> send_data
        <span class="token keyword">while</span> <span class="token boolean">True</span><span class="token punctuation">:</span>
            so <span class="token operator">=</span> socket<span class="token punctuation">.</span>socket<span class="token punctuation">(</span>socket<span class="token punctuation">.</span>AF_INET<span class="token punctuation">,</span> socket<span class="token punctuation">.</span>SOCK_STREAM<span class="token punctuation">)</span>
            so<span class="token punctuation">.</span>connect<span class="token punctuation">(</span><span class="token punctuation">(</span>host_ip<span class="token punctuation">,</span> port<span class="token punctuation">)</span><span class="token punctuation">)</span>
            so<span class="token punctuation">.</span>sendall<span class="token punctuation">(</span>send_data<span class="token punctuation">)</span>
            data <span class="token operator">=</span> <span class="token string">&#39;&#39;</span>
            <span class="token keyword">while</span> <span class="token boolean">True</span><span class="token punctuation">:</span>
                tmp <span class="token operator">=</span> so<span class="token punctuation">.</span>recv<span class="token punctuation">(</span><span class="token number">4096</span><span class="token punctuation">)</span>
                <span class="token keyword">if</span> <span class="token keyword">not</span> tmp<span class="token punctuation">:</span>
                    <span class="token keyword">break</span>
                data <span class="token operator">=</span> data <span class="token operator">+</span> tmp

            <span class="token comment"># socprint data</span>
            so<span class="token punctuation">.</span>close<span class="token punctuation">(</span><span class="token punctuation">)</span>
            ok <span class="token operator">=</span> <span class="token string">&quot;HTTP/1.1 200 OK&quot;</span>
            resp_first_line <span class="token operator">=</span> data<span class="token punctuation">[</span><span class="token punctuation">:</span><span class="token builtin">len</span><span class="token punctuation">(</span>ok<span class="token punctuation">)</span><span class="token punctuation">]</span>
            <span class="token keyword">print</span> resp_first_line
            <span class="token keyword">if</span> <span class="token punctuation">(</span>resp_first_line<span class="token punctuation">.</span>startswith<span class="token punctuation">(</span><span class="token string">&quot;HTTP/1.1 200&quot;</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">:</span>
                <span class="token keyword">break</span>
        self<span class="token punctuation">.</span>wfile<span class="token punctuation">.</span>write<span class="token punctuation">(</span>data<span class="token punctuation">)</span>

    <span class="token keyword">def</span> <span class="token function">do_GET</span><span class="token punctuation">(</span>self<span class="token punctuation">)</span><span class="token punctuation">:</span>
        uri <span class="token operator">=</span> self<span class="token punctuation">.</span>path
        <span class="token comment"># print uri</span>
        proto<span class="token punctuation">,</span> rest <span class="token operator">=</span> urllib<span class="token punctuation">.</span>splittype<span class="token punctuation">(</span>uri<span class="token punctuation">)</span>
        host<span class="token punctuation">,</span> rest <span class="token operator">=</span> urllib<span class="token punctuation">.</span>splithost<span class="token punctuation">(</span>rest<span class="token punctuation">)</span>
        <span class="token comment"># print host</span>
        path <span class="token operator">=</span> rest
        host<span class="token punctuation">,</span> port <span class="token operator">=</span> urllib<span class="token punctuation">.</span>splitnport<span class="token punctuation">(</span>host<span class="token punctuation">)</span>
        <span class="token keyword">if</span> port <span class="token operator">&lt;</span> <span class="token number">0</span><span class="token punctuation">:</span>
            port <span class="token operator">=</span> <span class="token number">80</span>
        <span class="token comment"># print host</span>
        host_ip <span class="token operator">=</span> socket<span class="token punctuation">.</span>gethostbyname<span class="token punctuation">(</span>host<span class="token punctuation">)</span>
        <span class="token comment"># print port</span>

        <span class="token keyword">del</span> self<span class="token punctuation">.</span>headers<span class="token punctuation">[</span><span class="token string">&#39;Proxy-Connection&#39;</span><span class="token punctuation">]</span>
        self<span class="token punctuation">.</span>headers<span class="token punctuation">[</span><span class="token string">&#39;Connection&#39;</span><span class="token punctuation">]</span> <span class="token operator">=</span> <span class="token string">&#39;close&#39;</span>

        send_data <span class="token operator">=</span> <span class="token string">&#39;GET &#39;</span> <span class="token operator">+</span> path <span class="token operator">+</span> <span class="token string">&#39; &#39;</span> <span class="token operator">+</span> self<span class="token punctuation">.</span>protocol_version <span class="token operator">+</span> <span class="token string">&#39;\\r\\n&#39;</span>
        head <span class="token operator">=</span> <span class="token string">&#39;&#39;</span>
        <span class="token keyword">for</span> key<span class="token punctuation">,</span> val <span class="token keyword">in</span> self<span class="token punctuation">.</span>headers<span class="token punctuation">.</span>items<span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">:</span>
            head <span class="token operator">=</span> head <span class="token operator">+</span> <span class="token string">&quot;%s: %s\\r\\n&quot;</span> <span class="token operator">%</span> <span class="token punctuation">(</span>key<span class="token punctuation">,</span> val<span class="token punctuation">)</span>
        send_data <span class="token operator">=</span> send_data <span class="token operator">+</span> head <span class="token operator">+</span> <span class="token string">&#39;\\r\\n&#39;</span>

        <span class="token keyword">while</span> <span class="token boolean">True</span><span class="token punctuation">:</span>
            <span class="token comment"># print send_data</span>
            so <span class="token operator">=</span> socket<span class="token punctuation">.</span>socket<span class="token punctuation">(</span>socket<span class="token punctuation">.</span>AF_INET<span class="token punctuation">,</span> socket<span class="token punctuation">.</span>SOCK_STREAM<span class="token punctuation">)</span>
            so<span class="token punctuation">.</span>connect<span class="token punctuation">(</span><span class="token punctuation">(</span>host_ip<span class="token punctuation">,</span> port<span class="token punctuation">)</span><span class="token punctuation">)</span>
            so<span class="token punctuation">.</span>sendall<span class="token punctuation">(</span>send_data<span class="token punctuation">)</span>

            data <span class="token operator">=</span> <span class="token string">&#39;&#39;</span>
            <span class="token keyword">while</span> <span class="token boolean">True</span><span class="token punctuation">:</span>
                tmp <span class="token operator">=</span> so<span class="token punctuation">.</span>recv<span class="token punctuation">(</span><span class="token number">4096</span><span class="token punctuation">)</span>
                <span class="token keyword">if</span> <span class="token keyword">not</span> tmp<span class="token punctuation">:</span>
                    <span class="token keyword">break</span>
                data <span class="token operator">=</span> data <span class="token operator">+</span> tmp

            <span class="token comment"># socprint data</span>
            so<span class="token punctuation">.</span>close<span class="token punctuation">(</span><span class="token punctuation">)</span>

            ok <span class="token operator">=</span> <span class="token string">&quot;HTTP/1.1 200 OK&quot;</span>
            resp_first_line <span class="token operator">=</span> data<span class="token punctuation">[</span><span class="token punctuation">:</span><span class="token builtin">len</span><span class="token punctuation">(</span>ok<span class="token punctuation">)</span><span class="token punctuation">]</span>
            <span class="token keyword">print</span> resp_first_line
            <span class="token keyword">if</span> <span class="token punctuation">(</span>resp_first_line<span class="token punctuation">.</span>startswith<span class="token punctuation">(</span><span class="token string">&quot;HTTP/1.1 200&quot;</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">:</span>
                <span class="token keyword">break</span>

        self<span class="token punctuation">.</span>wfile<span class="token punctuation">.</span>write<span class="token punctuation">(</span>data<span class="token punctuation">)</span>
    do_CONNECT <span class="token operator">=</span> do_GET


<span class="token keyword">def</span> <span class="token function">main</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">:</span>
    <span class="token keyword">try</span><span class="token punctuation">:</span>
        server <span class="token operator">=</span> HTTPServer<span class="token punctuation">(</span><span class="token punctuation">(</span><span class="token string">&#39;&#39;</span><span class="token punctuation">,</span> <span class="token number">8888</span><span class="token punctuation">)</span><span class="token punctuation">,</span> MyHandler<span class="token punctuation">)</span>
        <span class="token keyword">print</span>
        <span class="token string">&#39;Welcome to the machine...&#39;</span>
        server<span class="token punctuation">.</span>serve_forever<span class="token punctuation">(</span><span class="token punctuation">)</span>
    <span class="token keyword">except</span> KeyboardInterrupt<span class="token punctuation">:</span>
        <span class="token keyword">print</span>
        <span class="token string">&#39;^C received, shutting down server&#39;</span>
        server<span class="token punctuation">.</span>socket<span class="token punctuation">.</span>close<span class="token punctuation">(</span><span class="token punctuation">)</span>


<span class="token keyword">if</span> __name__ <span class="token operator">==</span> <span class="token string">&#39;__main__&#39;</span><span class="token punctuation">:</span>
    main<span class="token punctuation">(</span><span class="token punctuation">)</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>基本逻辑如下 <img src="`+v+'" alt=""></p><p>大致逻辑是监听本机的8888端口，获取如果目标站点没有返回响应头<code>HTTP/1.1 200</code>字符串，就重复发包，直到目标服务返回为止。</p><p>实战为例 这个环境通过请求判断是负载下有两个节点，一个是可以正常注入neoreg的，如下图所示： <img src="'+m+'" alt=""></p><p>另一个是注入失败的，返回500 <img src="'+b+'" alt=""></p><p>直接连neoreg是无法请求成功 <img src="'+h+'" alt=""></p><p>给neoreg设置http代理后，通过错误重传的脚本进行过滤后，就可以正常使用代理了 <img src="'+_+'" alt=""></p><p>同理，如果是godzilla，也可以挂http代理到这个错误重传的脚本上，同样实现该效果</p><p>这样做有一个缺点：发包量比以前大很多，具体视负载策略和负载后面的节点个数。</p><p>速度慢一点，不过至少能用了，总比没有好。</p><h2 id="进一步拓展思路" tabindex="-1"><a class="header-anchor" href="#进一步拓展思路" aria-hidden="true">#</a> 进一步拓展思路</h2><p>以上思路已经能解决只能注入一个内存马的场景了。</p><p>但是如果在尝试阶段，不小心多注入了多个内存马呢，但是又没能完全注入呢？ 比如三个负载节点，只注入成功了两个，用上面的脚本显然还是有问题的。</p><p>因为过滤条件只是判断返回是否为200，访问两个注入成功的节点会返回200，可能会导致我们的neoreg工具乱套。</p><p>所以如果继续改进的话，可以在注入内存马的时候，加入这么一段逻辑：通过特殊的header访问时也同时返回一个特殊的header标记，用来标记这个是哪个应用的内存马。</p><p>比如node1、node2成功注入，特殊请求时返回key: nodex。node3注入失败，自然也就不会返回。 <img src="'+g+'" alt=""></p><p>把这个标记加入到错误重传脚本检测逻辑中，这样就之会针对一个节点，也就是一个内存马进行请求了。</p><h2 id="总结" tabindex="-1"><a class="header-anchor" href="#总结" aria-hidden="true">#</a> 总结</h2><p>本文介绍了负载均衡下某些苛刻环境的内存马注入后如何连接的思路，并根据实战实现了一个demo脚本。</p><p>当时打比赛匆忙，只是临时手搓的一个脚本，脚本非常简陋，过滤条件十分简单粗暴，并且只支持http代理。</p><p>之后改进的想法的话，需要支持https协议，毕竟很多正经的站只允许https访问。</p><p>笔者抛砖引玉，希望可以给大佬们提供一些思路。</p><h2 id="参考" tabindex="-1"><a class="header-anchor" href="#参考" aria-hidden="true">#</a> 参考</h2><p>负载均衡下的 WebShell 连接: https://mp.weixin.qq.com/s/4Bmz_fuu0yrLMK1oBKKtRA</p>',35);function x(P,q){const t=e("ExternalLinkIcon");return o(),i("div",null,[y,n("p",null,[s("蚁剑作者给出了一种解决方案："),n("a",w,[s("负载均衡下的 WebShell 连接"),c(t)])]),T])}const H=p(f,[["render",x],["__file","fuzaijunhengxianacunmazhurukekehuanjingxiadesilu.html.vue"]]);export{H as default};
