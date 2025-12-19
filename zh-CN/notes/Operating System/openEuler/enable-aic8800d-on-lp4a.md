---
tags:
  - LicheePi 4A
  - openEuler
  - RISC-V
  - kernel
---

# 在 openEuler 24.03 SP2 RISC-V 上启用 AIC8800D WiFi 驱动

其实在 oerv 内核中已经编译了 AIC8800D 内核模块，我们只需要手动安装固件并将其启用。

## 测试环境

- 操作系统：`openEuler 24.03 LTS SP2`
- 内核版本：`6.6.0-98.0.0.103.oe2403sp2.riscv64`
- 硬件设备：`LicheePi 4A (th1520) 16G + 128G`

## 启用步骤

首先准备好 WiFi 模组的固件文件，从这里下载
```bash
curl -L https://github.com/discodyer/fw_aic8800/archive/v0.1.0.tar.gz | tar -xz --strip-components=1 -C /tmp
```

然后复制到 `/lib/firmware/aic8800/` 目录下
```bash
sudo mkdir -p /lib/firmware/aic8800
sudo cp -r /tmp/fw_aic8800/* /lib/firmware/aic8800/
sudo rm -rf /tmp/fw_aic8800 2>/dev/null
```

启用内核模块
```bash
sudo modprobe aic8800_bsp
sudo modprobe aic8800_fdrv
sudo modprobe aic8800_btlpm
```

随后就能正常使用 WiFi 功能了
```bash
ip link show
```
此时应该会出现一个 `wlan0` 设备

使用 `nmcli` 连接 WiFi
```bash
sudo nmcli device wifi connect YOUR_WIFI_SSID password YOUR_WIFI_PASSWORD
```
