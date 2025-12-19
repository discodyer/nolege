---
tags:
  - LicheePi 4A
  - openEuler
  - RISC-V
  - kernel
---

# 在 openEuler 24.03 SP2 RISC-V 上编译并启用 joydev 内核模块

## 编译步骤

首先下载并准备好内核源码
```bash
sudo dnf download --source kernel
sudo dnf install rpm-build
rpm -ivh kernel-6.6.0-98.0.0.103.oe2403sp2.src.rpm
cd ~/rpmbuild/SPECS/
rpmbuild -bp kernel.spec
```

安装必要的依赖和工具
```bash
sudo dnf install asciidoc audit-libs-devel binutils-devel dwarves elfutils-devel elfutils-libelf-devel gtk2-devel java-1.8.0-openjdk java-1.8.0-openjdk-devel java-devel libbabeltrace-devel libcap-devel libcap-ng-devel libpfm-devel libtraceevent-devel libunwind-devel llvm-devel newt-devel numactl-devel pciutils-devel perl-generators xmlto
```

修改内核设置
```bash
cd ~/rpmbuild/BUILD/kernel-6.6.0/linux-6.6.0-98.0.0.103.riscv64
sudo cp /boot/config-6.6.0-98.0.0.103.oe2403sp2.riscv64 ./.config
sudo make olddefconfig
sudo make menuconfig
```
此时会进入交互式编辑界面

选择需要构建的模块，`joydev` 模块导航到 `Device Drivers` -> `Input device support` -> `Joystick interface`，然后按下`M`，启用模块，然后保存配置。

编译并启用内核模块
```bash
sudo make modules_prepare
sudo make M=drivers/input/
sudo cp drivers/input/joydev.ko /lib/modules/6.6.0-98.0.0.103.oe2403sp2.riscv64/kernel/drivers/input/
sudo depmod -a
sudo modprobe joydev
```

查看手柄设备
```bash
ls /dev/input/js*
```
可以看到已经识别到了游戏手柄设备
```
/dev/input/js0
```
