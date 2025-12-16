---
tags:
  - sudo
  - user
  - linux
comment: true
---

# linux 创建新用户

这里记录一些常用命令

添加用户
```bash
useradd -m USER_NAME
```

删除用户
```bash
userdel -r USER_NAME
```

设置密码
```bash
passwd USER_NAME
```

把用户添加到`wheel`用户组
```bash
usermod -a -G wheel USER_NAME
```
