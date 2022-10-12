---
title: Mac M1配置proxychains
date: 2022-10-13 00:41:41
tags: [M1, Mac]
categories: 123
---

参考：https://github.com/rofl0r/proxychains-ng/issues/357

首先需要在Mac的恢复模式中关闭SIP，否则使用proxychains不会走代理，跟没用一样。
使用`csrutil status`命令查看是否关闭

proxychains-ng官方提供了这个`--fat-binary-m1`编译选项来解决这个问题，但是目前还没有打包，brew中也没有收录，这里自己先更个小版本临时用用
```bash
git clone https://github.com/rofl0r/proxychains-ng

# 这里临时使用的是自定义的4.17版本
# 核心是--fat-binary-m1这个选项
./configure --prefix=/opt/homebrew/Cellar/proxychains-ng/4.17 --sysconfdir=/opt/homebrew/etc --fat-binary-m1 --hookmethod=dyld
make
make install
make install-config
```

![](Pasted%20image%2020221011033245.png)

把这个二进制文件重新link一下
```bash
brew unlink proxychains-ng # 取消4.16旧版本的连接
brew link proxychains-ng
```
可以看到可以正常使用了
![](Pasted%20image%2020221011033511.png)
等官网发新版本吧，到时候重新brew一下就行了



