---
title: 写代码的人尼玛桑不起！！！！
date: 2011-03-12 21:12:00
updated: 2011-03-12 21:12:00
tags:
---
╮(╯_╰)╭  
好吧，我不是来咆哮的  
写了一天代码，头晕晕  
求bug  
```
#NoTrayIcon
#Region ;**** 参数创建于 ACNWrapper_GUI ****
#AutoIt3Wrapper_icon=icon.ICO
#AutoIt3Wrapper_outfile=D:\系统功能扩展.exe
#AutoIt3Wrapper_Res_Description=黑屏热键(Ctrl+F12)/自动ActiveSync同步设置/禁止ActiveSync自启动/记录电源信息
#AutoIt3Wrapper_Res_Fileversion=11.3.12.0
#AutoIt3Wrapper_Res_SaveSource=y
#AutoIt3Wrapper_Res_Field=参数|运行参数： 取消[黑屏热键]: /noMonitorPowerOff 取消[自动ActiveSync同步设置]: /noAutoActiveSync 取消禁止ActiveSync自启动]: /noActiveSyncRun 取消[记录电源信息]: /noBatteryStatus
#EndRegion ;**** 参数创建于 ACNWrapper_GUI ****


Global Const $lciWM_SYSCommand = 274
Global Const $lciSC_MonitorPower = 61808
Global Const $lciPower_Off = 1
Global Const $lciPower_On = -1
Global Const $TRAY_CHECKED = 1
Global Const $TRAY_UNCHECKED = 4
Global Const $TRAY_ENABLE = 64

Opt("WinTitleMatchMode", 4)
Opt("WinTextMatchMode", 2)
Opt("TrayMenuMode", 1)


;创建托盘
$Tray_Item_1 = TrayCreateItem("黑屏热键(Ctrl+F12)")
TrayCreateItem("")
$Tray_Item_2 = TrayCreateItem("自动ActiveSync同步设置")
TrayCreateItem("")
$Tray_Item_3 = TrayCreateItem("禁止ActiveSync自启动")
TrayCreateItem("")
$Tray_Item_4 = TrayCreateItem("记录电源信息")
TrayCreateItem("")
$Tray_Item_Exit = TrayCreateItem("退出", -1, -1, 0)
TraySetIcon(@ScriptFullPath, 0)
TraySetToolTip("系统功能扩展")
TraySetState()

;初始化黑屏热键
$Dll = DllOpen("user32.dll")
$MonitorPower = -1
If StringInStr($CmdLineRaw, "/noMonitorPowerOff") = 0 Then
 TrayItemSetState($Tray_Item_1, $TRAY_CHECKED)
 HotKeySet("^{F12}", "_MonitorPowerOff")
EndIf

;初始化自动ActiveSync同步设置
$WinTitle1 = "Microsoft ActiveSync"
$WinText1 = "如果您继续，您将只能同步文件、文件夹和其他"
$WinTitle2 = "同步设置向导"
$WinText2 = "欢迎使用 Pocket PC 同步设置向导"
If StringInStr($CmdLineRaw, "/noAutoActiveSync") = 0 Then
 TrayItemSetState($Tray_Item_2, $TRAY_CHECKED)
 AdlibRegister("_AutoActiveSync", 500)
EndIf

;开启ActiveSync启动项监测
If StringInStr($CmdLineRaw, "/noActiveSyncRun") = 0 Then
 TrayItemSetState($Tray_Item_3, $TRAY_CHECKED)
 AdlibRegister("_ActiveSyncRun", 5000)
EndIf

;初始化电源信息记录
Dim $Last_Data[6]
FileWriteLine("d:\电源记录.ini", IniRead("d:\电源记录.ini", "log", "last", "无上次退出记录") & "——程序退出")
FileWriteLine("d:\电源记录.ini", "")
$Write = 0
$Extra_Text = ""
If StringInStr($CmdLineRaw, "/noBatteryStatus") = 0 Then
 TrayItemSetState($Tray_Item_4, $TRAY_CHECKED)
 _BatteryStatus(1, "——程序启动")
 AdlibRegister("_BatteryStatus", 5000)
EndIf


While 1
 $msg = TrayGetMsg()
 Select
  Case $msg = 0
   ContinueLoop
  Case $msg = $Tray_Item_1 ;选项开关_黑屏热键(Ctrl+F12)
   Select
    Case TrayItemGetState($Tray_Item_1) = $TRAY_UNCHECKED + $TRAY_ENABLE
     HotKeySet("^{F12}")
     $MonitorPower = $lciPower_On
     $hwnd = WinGetHandle('classname=Progman')
     DllCall($Dll, "lresult", "SendMessageW", "hwnd", $hwnd, "uint", $lciWM_SYSCommand, "wparam", $lciSC_MonitorPower, "lparam", $lciPower_On)
    Case TrayItemGetState($Tray_Item_1) = $TRAY_CHECKED + $TRAY_ENABLE
     HotKeySet("^{F12}", "_MonitorPowerOff")
   EndSelect

  Case $msg = $Tray_Item_2 ;选项开关_自动ActiveSync同步设置
   Select
    Case TrayItemGetState($Tray_Item_2) = $TRAY_UNCHECKED + $TRAY_ENABLE
     AdlibUnRegister("_AutoActiveSync")
    Case TrayItemGetState($Tray_Item_2) = $TRAY_CHECKED + $TRAY_ENABLE
     AdlibRegister("_AutoActiveSync", 500)
   EndSelect

  Case $msg = $Tray_Item_3 ;选项开关_禁止ActiveSync自启动
   Select
    Case TrayItemGetState($Tray_Item_3) = $TRAY_UNCHECKED + $TRAY_ENABLE
     AdlibUnRegister("_ActiveSyncRun")
    Case TrayItemGetState($Tray_Item_3) = $TRAY_CHECKED + $TRAY_ENABLE
     AdlibRegister("_ActiveSyncRun", 5000)
   EndSelect

  Case $msg = $Tray_Item_4 ;选项开关_记录电源信息
   Select
    Case TrayItemGetState($Tray_Item_4) = $TRAY_UNCHECKED + $TRAY_ENABLE
     AdlibUnRegister("_BatteryStatus")
     _BatteryStatus(1, "——电源记录功能被关闭")
     IniWrite("d:\电源记录.ini", "log", "last", '')
    Case TrayItemGetState($Tray_Item_3) = $TRAY_CHECKED + $TRAY_ENABLE
     _BatteryStatus(1, "——电源记录功能被开启")
     AdlibRegister("_BatteryStatus", 5000)
   EndSelect

  Case $msg = $Tray_Item_Exit ;退出
   DllClose($Dll)
   Exit
 EndSelect
WEnd

;函数部分_黑屏热键(Ctrl+F12)
Func _MonitorPowerOff()
 If $MonitorPower = $lciPower_On Then
  $MonitorPower = $lciPower_Off
  $hwnd = WinGetHandle('classname=Progman')
  While $MonitorPower = $lciPower_Off And $msg <> $Tray_Item_Exit
   DllCall($Dll, "lresult", "SendMessageW", "hwnd", $hwnd, "uint", $lciWM_SYSCommand, "wparam", $lciSC_MonitorPower, "lparam", $lciPower_Off)
   Sleep(50)
  WEnd

 ElseIf $MonitorPower = $lciPower_Off Then
  $MonitorPower = $lciPower_On
  $hwnd = WinGetHandle('classname=Progman')
  DllCall($Dll, "lresult", "SendMessageW", "hwnd", $hwnd, "uint", $lciWM_SYSCommand, "wparam", $lciSC_MonitorPower, "lparam", $lciPower_On)
 EndIf
EndFunc   ;==>_MonitorPowerOff

;函数部分_自动ActiveSync同步设置
Func _AutoActiveSync()
 If WinExists($WinTitle1, $WinText1) = 1 Then
  WinActivate($WinTitle1, $WinText1)
  ControlClick($WinTitle1, $WinText1, "Button1")

  WinWait($WinTitle2, $WinText2, 1)
  WinActivate($WinTitle2, $WinText2)
  ControlClick($WinTitle2, $WinText2, "Button4")

  WinWait($WinTitle1, "", 1)
  WinClose($WinTitle1)
 EndIf
EndFunc   ;==>_AutoActiveSync

;函数部分_禁止ActiveSync自启动
Func _ActiveSyncRun()
 RegDelete("HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Run", "H/PC Connection Agent")
EndFunc   ;==>_ActiveSyncRun

;函数部分_记录电源信息
Func _BatteryStatus($Write = 0, $Extra_Text = "")
 $Data = _WinAPI_GetSystemPowerStatus();获取电源信息

 ;分析电源状态
 Switch $Data[0]
  Case 0
   $PowerStatus = 'DC'
  Case 1
   $PowerStatus = 'AC'
  Case Else
   $PowerStatus = 'Unknown'
 EndSwitch

 ;计算剩余时间并补零
 $Hour = Int($Data[3] / 3600)
 $Min = Int(($Data[3] - $Hour * 3600) / 60)
 If $Min < 10 Then $Min = "0" & $Min

 ;百分比补零
 $Percent = $Data[2]
 If $Percent < 10 Then $Percent = "0" & $Percent
 $Line = @YEAR & "-" & @MON & "-" & @MDAY & ", " & @HOUR & ":" & @MIN & ":" & @SEC & ", " & $PowerStatus & ", " & $Percent & "%, " & $Hour & ":" & $Min

 IniWrite("d:\电源记录.ini", "log", "last", '"' & $Line & '"')
 If $Data[0] <> $Last_Data[0] Or $Data[3] <> $Last_Data[3] Or $Data[2] <> $Last_Data[2] Or $Write = 1 Then FileWriteLine("d:\电源记录.ini", $Line & $Extra_Text)

 For $i = 0 To 4
  $Last_Data[$i] = $Data[$i]
 Next
EndFunc   ;==>_BatteryStatus


Func _WinAPI_GetSystemPowerStatus()

 Local $tSYSTEM_POWER_STATUS = DllStructCreate('byte;byte;byte;byte;dword;dword')
 Local $Ret = DllCall('kernel32.dll', 'int', 'GetSystemPowerStatus', 'ptr', DllStructGetPtr($tSYSTEM_POWER_STATUS))

 If (@error) Or (Not $Ret[0]) Then
  Return SetError(1, 0, 0)
 EndIf

 Local $Result[5]

 $Result[0] = DllStructGetData($tSYSTEM_POWER_STATUS, 1)
 $Result[1] = DllStructGetData($tSYSTEM_POWER_STATUS, 2)
 $Result[2] = DllStructGetData($tSYSTEM_POWER_STATUS, 3)
 $Result[3] = DllStructGetData($tSYSTEM_POWER_STATUS, 5)
 $Result[4] = DllStructGetData($tSYSTEM_POWER_STATUS, 6)

 For $i = 3 To 4
  If _WinAPI_DWordToInt($Result[$i]) = -1 Then
   $Result[$i] = -1
  EndIf
 Next

 Return $Result
EndFunc   ;==>_WinAPI_GetSystemPowerStatus

 

Func _WinAPI_DWordToInt($iValue)

 Local $tData = DllStructCreate('int')

 DllStructSetData($tData, 1, $iValue)

 Return DllStructGetData($tData, 1)
EndFunc   ;==>_WinAPI_DWordToInt
```