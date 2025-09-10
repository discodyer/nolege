---
tags:
  - tools
  - usb
  - camera
---

# Ubuntu 下固定 USB 摄像头设备名称（udev 规则）

当系统中存在多台摄像头时，`/dev/video0` 和 `/dev/video1` 的顺序可能会变化，导致程序无法稳定识别指定摄像头。  
为了解决这个问题，可以通过 **udev 规则** 创建一个固定的符号链接，例如 `/dev/video_cam`，无论系统如何分配 `videoX`，该链接始终指向同一台物理摄像头。

---

## ✅ 方案概述

- 利用 **物理 USB 端口** + **设备序列号** 绑定摄像头  
- 创建固定符号链接 `/dev/video_cam`  
- 不修改系统默认的 `video0`/`video1`，避免冲突  


## ✅ 推荐方案：基于物理 USB 端口 + 序列号匹配

### **1. 获取摄像头信息**

使用以下命令查看设备的物理端口和序列号：

```bash
udevadm info --query=all --name=/dev/video0 | grep '{serial}\|KERNELS'
```

示例输出：

```
E: KERNELS=3-2
E: ATTRS{serial}=EP.20CC54K01
```

- **`KERNELS=="3-2"`** ：摄像头插在 USB 总线的 3-2 端口
- **`ATTRS{serial}=="EP.20CC54K01"`** ：摄像头的唯一序列号

---

### **2. 编写 udev 规则**

编辑规则文件：

```bash
sudo nano /etc/udev/rules.d/99-usb-camera.rules
```

写入以下内容：

```bash
SUBSYSTEM=="video4linux", SUBSYSTEMS=="usb", KERNELS=="3-2", ATTRS{serial}=="EP.20CC54K01", SYMLINK+="video_cam"
```

- `SUBSYSTEM=="video4linux"` ：匹配 V4L2 设备
- `SUBSYSTEMS=="usb"` ：确保是 USB 设备
- `KERNELS=="3-2"` ：匹配物理端口（防止插错口）
- `ATTRS{serial}=="EP.20CC54K01"` ：匹配设备唯一序列号
- `SYMLINK+="video_cam"` ：创建 `/dev/video_cam` 符号链接

---

### **3. 应用规则**

刷新规则并触发设备：

```bash
sudo udevadm control --reload-rules
sudo udevadm trigger
```

---

### **4. 验证结果**

重新插拔摄像头后，检查：

```bash
ls -l /dev/video*
```

输出示例：

```
crw-rw----+ 1 root video 81, 0 Aug 31 20:15 /dev/video0
crw-rw----+ 1 root video 81, 1 Aug 31 20:15 /dev/video1
lrwxrwxrwx 1 root root      6 Aug 31 20:15 /dev/video_cam -> video0
```

✅ 不论系统如何分配 `/dev/video0` 或 `/dev/video1`，`/dev/video_cam` 永远指向指定摄像头。

---

## **为什么这样更稳？**

- **物理 USB 端口固定** → `KERNELS=="3-2"`
- **序列号唯一** → `ATTRS{serial}=="EP.20CC54K01"`
- **不强制绑定 video0/1** → 避免与系统规则冲突
- **只创建符号链接** → 程序直接访问 `/dev/video_cam`

---

> ⚠ **注意**：如果更换了 USB 端口，需要更新规则中的 `KERNELS`。  
> 可以为每个摄像头设置不同的符号链接，如 `/dev/video_cam_front`、`/dev/video_cam_down`。

---

### ✅ **扩展**
如果有 **两台摄像头**，可以写两条规则，例如：

```bash
SUBSYSTEM=="video4linux", SUBSYSTEMS=="usb", ATTRS{serial}=="ABC123", SYMLINK+="video_cam_front"
SUBSYSTEM=="video4linux", SUBSYSTEMS=="usb", ATTRS{serial}=="XYZ456", SYMLINK+="video_cam_down"
```

这样可以通过固定的设备名在程序中调用，避免 `/dev/video0` 和 `/dev/video1` 混乱的问题。
