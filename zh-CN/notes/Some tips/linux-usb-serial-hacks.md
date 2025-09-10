---
tags:
  - tools
---

# Ubuntu下的USB串口使用技巧

本文默认在ubuntu 22.04下测试，其他系统或版本可能有些许差异

## 解决串口权限问题

如果是刚装好的系统，用户是没有权限访问串口设备的，不推荐直接使用root用户。只需要把当前用户放到dialout用户组下就可以访问串口设备了

```bash
sudo usermod -a -G dialout $USER
```

再用命令检查一下用户是否已经添加到dialout组了

```bash
groups # 不带参数的groups命令会显示当前登录用户的所属组
```

## 解决插入多个USB串口设备串口号会变

可以通过设置udev规则，根据串口的设备序列号绑定到不同的路径下

首先需要确定每个设备的唯一标识，如序列号、厂商ID、产品ID等，比如查询设备`/dev/ttyACM0`

```bash
udevadm info --attribute-walk --path=$(udevadm info --query=path --name=/dev/ttyACM0)
```

在输出中查找`ATTRS{serial}`信息，也可以使用grep命令工具查找

假设A设备的序列号为`AAAAAAAA`，B设备的序列号为`BBBBBBBB`

修改`/etc/udev/rules.d/99-usb-serial.rules`文件

```bash
sudo nano /etc/udev/rules.d/99-usb-serial.rules
```

添加如下内容

```
SUBSYSTEM=="tty", ATTRS{serial}=="AAAAAAAA", SYMLINK+="ttyACM_A", MODE="0666"
SUBSYSTEM=="tty", ATTRS{serial}=="BBBBBBBB", SYMLINK+="ttyACM_B", MODE="0666"
```

重新加载udev规则并触发设备

```bash
sudo udevadm control --reload-rules
sudo udevadm trigger
```

上面的功能是根据序列号给不同的串口设备设置符号链接，这样就可以使用`/dev/ttyACM_A`来访问序列号为`"AAAAAAAA"`的设备了，重新插拔设备，检查是否生成固定的设备名，通过`ls -l /dev/ttyACM_*`查看
