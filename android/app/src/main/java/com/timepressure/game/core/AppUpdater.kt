package com.timepressure.game.core

import android.app.DownloadManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.Settings
import androidx.core.content.FileProvider
import com.timepressure.game.BuildConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.File
import java.net.HttpURLConnection
import java.net.URL

object AppUpdater {
    // Tên repository GitHub chứa releases APK (tương tự như Nagaruu/consay)
    var githubRepo: String = "Nagaruu/timepressure"

    data class UpdateInfo(
        val tag: String,
        val tagNumber: Int,
        val notes: String,
        val apkUrl: String
    )

    sealed interface CheckResult {
        data class UpdateAvailable(val info: UpdateInfo) : CheckResult
        data object UpToDate : CheckResult
        data class Error(val message: String) : CheckResult
    }

    suspend fun checkForUpdates(customRepo: String? = null): CheckResult = withContext(Dispatchers.IO) {
        val repo = customRepo ?: githubRepo
        val apiUrl = "https://api.github.com/repos/$repo/releases/latest"

        try {
            val url = URL(apiUrl)
            val conn = url.openConnection() as HttpURLConnection
            conn.connectTimeout = 10_000
            conn.readTimeout = 10_000
            conn.setRequestProperty("Accept", "application/vnd.github.v3+json")
            conn.setRequestProperty("User-Agent", "TimePressure-App")

            if (conn.responseCode != 200) {
                return@withContext CheckResult.Error("Không tìm thấy bản phát hành (Mã: ${conn.responseCode})")
            }

            val body = conn.inputStream.bufferedReader().use { it.readText() }
            val json = JSONObject(body)
            val tagName = json.optString("tag_name", "")
            val tagNumber = tagName.removePrefix("v").toIntOrNull() ?: 0
            val bodyNotes = json.optString("body", "Bản cập nhật mới")

            // Tìm asset APK
            val assets = json.optJSONArray("assets")
            var downloadUrl = ""
            if (assets != null) {
                for (i in 0 until assets.length()) {
                    val asset = assets.getJSONObject(i)
                    val name = asset.optString("name", "")
                    if (name.endsWith(".apk")) {
                        downloadUrl = asset.optString("browser_download_url", "")
                        break
                    }
                }
            }

            if (downloadUrl.isBlank()) {
                return@withContext CheckResult.Error("Release chưa có file APK đính kèm.")
            }

            val currentVersionCode = BuildConfig.VERSION_CODE
            if (tagNumber > currentVersionCode) {
                CheckResult.UpdateAvailable(
                    UpdateInfo(
                        tag = tagName,
                        tagNumber = tagNumber,
                        notes = bodyNotes,
                        apkUrl = downloadUrl
                    )
                )
            } else {
                CheckResult.UpToDate
            }
        } catch (e: Exception) {
            CheckResult.Error("Lỗi kết nối kiểm tra cập nhật: ${e.localizedMessage}")
        }
    }

    /**
     * Tự động tải file APK bằng DownloadManager và mở cửa sổ cài đặt của hệ điều hành.
     */
    fun startUpdateDownload(context: Context, updateInfo: UpdateInfo) {
        val fileName = "time-pressure-${updateInfo.tag}.apk"
        val dir = context.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS) ?: context.filesDir
        val destinationFile = File(dir, fileName)
        if (destinationFile.exists()) {
            destinationFile.delete()
        }

        val downloadManager = context.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
        val request = DownloadManager.Request(Uri.parse(updateInfo.apkUrl)).apply {
            setTitle("Đang tải Time Pressure ${updateInfo.tag}...")
            setDescription("Tự động tải bản cập nhật mới nhất")
            setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
            setDestinationUri(Uri.fromFile(destinationFile))
            setMimeType("application/vnd.android.package-archive")
        }

        val downloadId = downloadManager.enqueue(request)

        // Đăng ký Receiver chờ tải xong để lập tức kích hoạt cài đặt
        val onCompleteReceiver = object : BroadcastReceiver() {
            override fun onReceive(recvContext: Context, intent: Intent) {
                val id = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1L)
                if (id == downloadId) {
                    try {
                        context.unregisterReceiver(this)
                    } catch (_: Exception) {}

                    triggerApkInstall(context, destinationFile)
                }
            }
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            context.registerReceiver(
                onCompleteReceiver,
                IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE),
                Context.RECEIVER_EXPORTED
            )
        } else {
            context.registerReceiver(
                onCompleteReceiver,
                IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE)
            )
        }
    }

    /**
     * Kích hoạt trình cài đặt hệ thống (Người dùng chỉ cần bấm 1 chạm vào nút "Cập nhật").
     */
    fun triggerApkInstall(context: Context, apkFile: File) {
        if (!apkFile.exists()) return

        // Kiểm tra quyền cài đặt từ nguồn ngoài trên Android 8.0+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            if (!context.packageManager.canRequestPackageInstalls()) {
                val grantIntent = Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES).apply {
                    data = Uri.parse("package:${context.packageName}")
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                context.startActivity(grantIntent)
                return
            }
        }

        val apkUri = FileProvider.getUriForFile(
            context,
            "${context.packageName}.fileprovider",
            apkFile
        )

        val installIntent = Intent(Intent.ACTION_VIEW).apply {
            setDataAndType(apkUri, "application/vnd.android.package-archive")
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_GRANT_READ_URI_PERMISSION
        }
        context.startActivity(installIntent)
    }
}
