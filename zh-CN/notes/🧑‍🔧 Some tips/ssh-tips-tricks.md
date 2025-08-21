---
title: SSH 的一些奇技淫巧
---
# SSH 的一些奇技淫巧

页面大纲：
[[toc]]

阅读本文需要的前置知识

- 文件路径的概念
- 知道如何打开和使用终端
- 知道如何使用基本的命令行程序

## 写在前面

SSH是一个非常好用的工具，很有必要学习一下如何使用

本文会介绍如何在`windows`操作系统下使用SSH工具

## 安装

恭喜你，OpenSSH工具在`windows10`下是自带的，因此无需另外安装

## 生成你的密钥

要直接使用密码进行连接也是可以的，但为了安全性，还是推荐你使用`密钥对`进行登录

### 什么是SSH密钥对

简单来说，SSH密钥对是由`公钥`和`私钥`组成的，`公钥`就相当于一个锁，可以用来加密信息，只有对应的私钥才能解开来。其中的`私钥`不能给除了你自己外的任何人。

![公开密钥加密](https://upload.wikimedia.org/wikipedia/commons/9/98/Asymmetric_encryption_%28colored%29.png)

当然这样的比喻还是有点不恰当，具体的细节非常复杂，请参考下面并结合搜索引擎自己探索

- [维基百科 - Secure Shell](https://w.wiki/69P5)
- [维基百科 - 公开密钥加密](https://zh.wikipedia.org/wiki/%E5%85%AC%E5%BC%80%E5%AF%86%E9%92%A5%E5%8A%A0%E5%AF%86)

### 生成你的密钥对

生成密钥对很简单。要用到的是`ssh-keygen`这个命令行程序

`ssh-keygen -t ed25519 -C "your_email@example.com"`

上面的命令中，`-t`参数是你要使用的密钥加密算法，我们这里使用`ed25519`算法，`-C`参数后面是你的邮箱

```powershell
(base) PS C:\Users\cody> ssh-keygen -t ed25519 -C "your_email@example.com"
Generating public/private ed25519 key pair.
Enter file in which to save the key (C:\Users\cody/.ssh/id_ed25519):
```

程序会提示你输入一个位置保存密钥文件，这边推荐直接使用默认位置就行，如果你需要生成多个密钥，可以在这边进行重命名，防止被覆盖

如果你使用的是默认位置，直接回车就行。windows下不推荐使用其他位置，因为权限问题你很可能没法解决

```powershell
(base) PS C:\Users\cody> ssh-keygen -t ed25519 -C "your_email@example.com"
Generating public/private ed25519 key pair.
Enter file in which to save the key (C:\Users\cody/.ssh/id_ed25519):
Enter passphrase (empty for no passphrase):
```

这边程序又提示你要输入密码，如果你设置了密码，每次使用此私钥的时候都需要手动输入密码解锁，相当于二重保险。如果你保证你的密钥不被别人盗取的话，或者你嫌麻烦的话，可以直接留空，也就是敲击回车就行，然后会提示你再次输入一样的密码，再次回车就行。

```powershell
(base) PS C:\Users\cody> ssh-keygen -t ed25519 -C "your_email@example.com"
Generating public/private ed25519 key pair.
Enter file in which to save the key (C:\Users\cody/.ssh/id_ed25519):
Enter passphrase (empty for no passphrase):
Enter same passphrase again:
Your identification has been saved in C:\Users\cody/.ssh/id_ed25519.
Your public key has been saved in C:\Users\cody/.ssh/id_ed25519.pub.
The key fingerprint is:
SHA256:H76e+qDXdtpvYuZCmkU8BJ37FmlHO7qiUfqslGr2jfw your_email@example.com
The key's randomart image is:
+--[ED25519 256]--+
|        .o .     |
|          +   .  |
|         o . o . |
|          = + +  |
|        S.o+ + . |
|         *o.+    |
|        **o. .   |
|      o=+B=+* .  |
|     oooBOEOo+.  |
+----[SHA256]-----+
```

输出这些说明密钥生成完毕了，可以使用ls命令查看~/.ssh文件夹的内容

```powershell
(base) PS C:\Users\cody> ls ~/.ssh
    目录: C:\Users\cody\.ssh
Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
-a----        12/25/2022   8:40 PM            419 id_ed25519
-a----        12/25/2022   8:40 PM            105 id_ed25519.pub
-a----        12/25/2022   4:41 PM           6923 known_hosts
```

使用`cat`命令输出公钥

```powershell
(base) PS C:\Users\cody> cat C:\Users\cody/.ssh/id_ed25519.pub
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIDrSxkSbIiUivEsSiddKFR/m/liPErWChoM2iMaJxIzG your_email@example.com
```

`ssh-ed25519`开头的这一串东西就是你的公钥啦，注意不要搞错了，私钥不一样，是没有`.pub`后缀的那个文件

## Github导入公钥

将你的私钥导入Github，这样就可以使用你的私钥免密拉取仓库或者提交代码了

在这之前，你要有一个Github账号，并登录

进入Github的[官网](https://github.com/)

点击右上角的头像，然后在下拉菜单中点击`Settings`

![](images/github-settings.png)

然后点击左侧的`SSH and GPG keys`选项卡，然后点击右侧的`NEW SSH key`按钮

![](images/github-ssh.png)

然后填入你的密钥的名称，可以自定义，比如你的笔记本

然后 `Key Type` 选择 `Authentication Key`

再在下面那个框里粘贴你的公钥

![](images/github-ssh2.png)

然后点击`Add SSH key`保存就行

打开你的终端，输入命令`ssh -T git@github.com`测试

```powershell
(base) PS C:\Users\cody> ssh -T git@github.com
The authenticity of host 'github.com (198.18.0.121)' can't be established.
ECDSA key fingerprint is SHA256:p2QAMXNIC1TJYWeIOttrVc98/R1BUFWu3/LiyKgUfQM.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
Warning: Permanently added 'github.com' (ECDSA) to the list of known hosts.
Hi discodyer! You've successfully authenticated, but GitHub does not provide shell access.
Connection to github.com closed.
```

由于是第一次尝试连接Github，所以SSH会提示你是否确认连接目标主机，然后你输入`yes`并回车就行，然后程序会自动在`~/.ssh/known_hosts`文件中记录目标主机的公钥信息。

下次连接的时候就无需输入yes了。

对了，到这边你的仓库克隆的时候就可以使用ssh方式了。

![](images/git-ssh-clone.png)

或者修改已有仓库的remote到这个链接，无需重新克隆

## SSH登录远程服务器

### 目标主机的配置

需要先在目标主机上添加你的公钥，修改对应用户目录下的`~/.ssh/authorized_keys`文件，如果没有的话需要先创建

在这个文件里添加一行，也就是你的公钥，然后保存

<!-- 然后修改服务器ssh的配置文件`/etc/ssh/sshd_config` -->

然后重启sshd服务，使用命令`systemctl restart sshd.service`

然后使用命令`ssh 用户名@目标主机 -p 端口号`就可以连接了

如果有问题，可以加上`-vvv`参数显示详细信息帮助排障

## 配置文件

这边是关于配置文件的提示

## VSCode Remote 插件使用

在`VSCode`的插件页面搜索`ms-vscode-remote.remote-ssh`并安装

然后在左侧栏会多出一个图标 ![](images/vscode-remote-icon.png)

点击图标，然后点击这个小齿轮

![](images/vscode-remote-1.png)

在弹出的地方选择这个配置文件，注意不要选错了，我们默认用windows自带的OpenSSL配置文件

![](images/vscode-remote-2.png)

然后在里面加入下面几行，注意要改成远程服务器对应的内容

```text
Host example.com # 远程主机的别名
    HostName example.com # 远程主机的地址
    Port 22 # 远程主机的ssh端口
    User UserName # 这边改成你自己的远程服务器linux用户名
        ForwardAgent yes # 这个选项是开启ssh-forward功能，不需要的话可以不添加
```

添加好以后，注意保存配置文件，然后点击左侧的刷新按钮

![](images/vscode-remote-3.png)

然后就可以点击添加的服务器右侧的按钮进行连接

### 如果Github无法使用SSH克隆仓库

可以尝试使用443端口连接，在~/.ssh/config文件下添加下面的内容

```text
Host github.com
    User git
    Port 443
    HostName ssh.github.com
```

### Github和Gitee的用户名不一样

可以手动指定Gitee的用户名，在~/.ssh/config文件下添加下面的内容

```text
Host gitee.com
    HostName gitee.com
    User <你的用户名>
```

## Canokey 配置

请参考[这个仓库](https://github.com/discodyer/GPG-config-steps)

如果你没有`YubiKey`或者`Canokeys`的话，就不需要进行下面的操作

当然这部分是记录一下`windows`安装`GNUPG`并配置`Canokeys`进行`ssh鉴权`

Gnupg configuration guide under windows with Canokeys  
记录一下 windows 的 GPG (Canokeys) 安装和配置步骤

1. 下载并安装[Gpg4win](https://gpg4win.org/get-gpg4win.html)

2. 导入公钥
```powershell
PS C:\> gpg --import public-key.pub
```

3. 设置子密钥指向 `Canokey`
```powershell
PS C:\> gpg --edit-card
gpg/card> fetch
```

4. 查看本地私钥，可以看到已经指向了 `Canokey`
```powershell
PS C:\> gpg --fingerprint --keyid-format long -K
```

5. 导入成功后，进入编辑模式，以设置密钥信任等级为 `绝对（Ultimate）`。
```powershell
PS C:\> gpg --edit-key email@example.com
```

6. 获取`身份验证（Authentication）`独立子密钥的 `KeyGrip`
```powershell
PS C:\> gpg -K --with-keygrip
```
复制以`[A]`为标识的`身份验证（Authentication）`独立子密钥的 `KeyGrip`，创建并添加到`%APPDATA%\Roaming\gnupg\sshcontrol`文件中，之后另起一行。注意换行符需要是`LF`，不能是`CRLF`

7. 创建并在`%APPDATA%\Roaming\gnupg\gpg-agent.conf`中插入
```
enable-ssh-support
enable-putty-support
```
创建并在`%APPDATA%\Roaming\gnupg\gpg.conf`中插入
```
use-agent
```
注意需要另起一行，换行符需要是`LF`，不能是`CRLF`

8. 下载[`wsl-ssh-pageant-amd64-gui.exe`](https://github.com/benpye/wsl-ssh-pageant/releases)，创建并放到`C:\wsl-ssh-pageant\`目录下

9. 在`C:\wsl-ssh-pageant\`目录下创建脚本文件 `gpg-agent.vbs` 内容如下
```
sockFilePath = "C:\wsl-ssh-pageant\ssh-agent.sock"
Set fso = CreateObject("Scripting.FileSystemObject")
IF fso.FileExists(sockFilePath) Then
    fso.DeleteFile sockFilePath
End If

With CreateObject("Wscript.Shell")
    .Run """C:\Program Files (x86)\gnupg\bin\gpg-connect-agent.exe"" /bye", 0
    .Run "C:\wsl-ssh-pageant\wsl-ssh-pageant-amd64-gui.exe --force --wsl C:\wsl-ssh-pageant\ssh-agent.sock --winssh ssh-pageant --systray", 0
    .Run "powershell -ExecutionPolicy Bypass -File C:\wsl-ssh-pageant\notice.ps1", 0
End With
```

创建脚本文件 `notice.ps1` 内容如下
```
Add-Type -AssemblyName System.Windows.Forms
$notifyIcon = New-Object System.Windows.Forms.NotifyIcon

# 加载一个图标（这里使用系统图标，你也可以指定其他图标的路径）
$notifyIcon.Icon = [System.Drawing.SystemIcons]::Information
$notifyIcon.Visible = $true

# 显示通知提示
$notifyIcon.ShowBalloonTip(10000, "wsl-ssh-pageant", "ssh-agent created.", [System.Windows.Forms.ToolTipIcon]::Info)

# 防止脚本结束后立即消失
Start-Sleep -Seconds 1

# 清理图标，避免在系统托盘中留下死图标
$notifyIcon.Dispose()
```

然后给`gpg-agent.vbs`创建一个快捷方式，复制到开始菜单的启动文件夹下让它开机自启

10.添加环境变量 `SSH_AUTH_SOCK` = `\\.\pipe\ssh-pageant`

11.运行
```powershell
PS C:\> ssh-add -L 
```

查看是否和
```powershell
PS C:\> gpg --export-ssh-key YOUR_KEY_ID 
```

输出一致

如果输出是

```
Error connecting to agent: No such file or directory 
```

查看`ssh-agent`是否正常运行

```powershell
PS C:\> get-service ssh* 
```

管理员权限运行`Powershell`

`Win`＋`R`，输入 `wt`，同时按下 `Ctrl`＋`Shift`＋`Enter`

```powershell
PS C:\> Set-Service -Name ssh-agent -StartupType Manual
PS C:\> Start-Service ssh-agent
```
手动启动一下服务

12. 进行一个重启

13. `~/.ssh/config`

```
Host github.com
    User git
    Port 443
    HostName ssh.github.com
```

14. `~/.gitconfig`

```
[core]
	sshCommand = \"C:/Windows/System32/OpenSSH/ssh.exe\"
[commit]
	gpgsign = true
[gpg]
	program = C:\\Program Files (x86)\\GnuPG\\bin\\gpg.exe
[credential "https://gitee.com"]
	provider = generic
```

## reference

https://github.com/benpye/wsl-ssh-pageant

https://gist.github.com/matusnovak/302c7b003043849337f94518a71df777

https://lab.jinkan.org/2021/08/01/using-gpg-for-ssh-authentication-on-windows-10/

https://developer.aliyun.com/article/848731#slide-9