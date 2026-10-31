package com.timepressure.game.ui

import android.annotation.SuppressLint
import android.os.Bundle
import android.view.ViewGroup
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.SystemUpdate
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import com.timepressure.game.BuildConfig
import com.timepressure.game.core.AppUpdater

class WebAppBridge {
    @JavascriptInterface
    fun getAppVersion(): String {
        return "v${BuildConfig.VERSION_CODE} (${BuildConfig.VERSION_NAME})"
    }
}

class MainActivity : ComponentActivity() {

    private var webViewRef: WebView? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContent {
            MaterialTheme(colorScheme = darkColorScheme()) {
                val context = LocalContext.current
                var availableUpdate by remember { mutableStateOf<AppUpdater.UpdateInfo?>(null) }

                // Tự động kiểm tra bản cập nhật mới từ GitHub khi mở game (giống app con-say)
                LaunchedEffect(Unit) {
                    try {
                        val res = AppUpdater.checkForUpdates()
                        if (res is AppUpdater.CheckResult.UpdateAvailable) {
                            availableUpdate = res.info
                        }
                    } catch (_: Throwable) {
                    }
                }

                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(Color(0xFF09090D))
                ) {
                    // Game WebView Container
                    AndroidView(
                        factory = { ctx ->
                            WebView(ctx).apply {
                                layoutParams = ViewGroup.LayoutParams(
                                    ViewGroup.LayoutParams.MATCH_PARENT,
                                    ViewGroup.LayoutParams.MATCH_PARENT
                                )
                                setupWebView(this)
                                loadUrl("file:///android_asset/web/index.html")
                                webViewRef = this
                            }
                        },
                        modifier = Modifier.fillMaxSize()
                    )

                    // Banner thông báo cập nhật phiên bản mới (giống cơ chế 1 chạm của con-say)
                    AnimatedVisibility(
                        visible = availableUpdate != null,
                        enter = slideInVertically(initialOffsetY = { -it }),
                        exit = slideOutVertically(targetOffsetY = { -it }),
                        modifier = Modifier
                            .fillMaxWidth()
                            .align(Alignment.TopCenter)
                            .padding(horizontal = 16.dp, vertical = 24.dp)
                    ) {
                        availableUpdate?.let { updateInfo ->
                            Card(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .border(1.5.dp, Color(0xFFEF4444), RoundedCornerShape(16.dp)),
                                colors = CardDefaults.cardColors(containerColor = Color(0xFF140D14)),
                                shape = RoundedCornerShape(16.dp),
                                elevation = CardDefaults.cardElevation(defaultElevation = 10.dp)
                            ) {
                                Column(
                                    modifier = Modifier.padding(16.dp),
                                    verticalArrangement = Arrangement.spacedBy(10.dp)
                                ) {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.SystemUpdate,
                                            contentDescription = null,
                                            tint = Color(0xFFEF4444)
                                        )
                                        Text(
                                            text = "Đã có bản cập nhật ${updateInfo.tag}!",
                                            fontWeight = FontWeight.Bold,
                                            color = Color.White,
                                            fontSize = 16.sp
                                        )
                                    }

                                    Text(
                                        text = updateInfo.notes,
                                        color = Color(0xFFE2E8F0),
                                        fontSize = 13.sp,
                                        maxLines = 3
                                    )

                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.End,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        TextButton(
                                            onClick = { availableUpdate = null }
                                        ) {
                                            Text(text = "Để sau", color = Color(0xFFA1A1AA))
                                        }

                                        Spacer(modifier = Modifier.width(8.dp))

                                        Button(
                                            onClick = {
                                                try {
                                                    Toast.makeText(
                                                        context,
                                                        "Đang tải bản cập nhật ${updateInfo.tag}...",
                                                        Toast.LENGTH_SHORT
                                                    ).show()
                                                    AppUpdater.startUpdateDownload(context, updateInfo)
                                                } catch (_: Throwable) {
                                                }
                                                availableUpdate = null
                                            },
                                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFEF4444)),
                                            shape = RoundedCornerShape(10.dp)
                                        ) {
                                            Icon(
                                                imageVector = Icons.Default.Download,
                                                contentDescription = null,
                                                modifier = Modifier.size(16.dp)
                                            )
                                            Spacer(modifier = Modifier.width(6.dp))
                                            Text(
                                                text = "Cập nhật ngay",
                                                fontWeight = FontWeight.Bold,
                                                color = Color.White
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // Gọi ẩn thanh hệ thống SAU KHI DecorView đã khởi tạo xong để tránh lỗi NullPointerException trên Android 11+
        window?.decorView?.post {
            hideSystemUI()
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView(webView: WebView) {
        try {
            with(webView.settings) {
                javaScriptEnabled = true
                domStorageEnabled = true
                databaseEnabled = true
                allowFileAccess = true
                allowContentAccess = true
                mediaPlaybackRequiresUserGesture = false
                cacheMode = WebSettings.LOAD_DEFAULT
                useWideViewPort = true
                loadWithOverviewMode = true
            }

            webView.isVerticalScrollBarEnabled = false
            webView.isHorizontalScrollBarEnabled = false
            webView.setBackgroundColor(android.graphics.Color.parseColor("#09090D"))
            webView.addJavascriptInterface(WebAppBridge(), "AndroidBridge")
            webView.webChromeClient = WebChromeClient()
            webView.webViewClient = object : WebViewClient() {
                override fun onPageFinished(view: WebView?, url: String?) {
                    super.onPageFinished(view, url)
                    hideSystemUI()
                }
            }
        } catch (_: Throwable) {
        }
    }

    private fun hideSystemUI() {
        try {
            val decorView = window?.decorView ?: return
            WindowCompat.setDecorFitsSystemWindows(window, false)
            val controller = WindowCompat.getInsetsController(window, decorView)
            controller.hide(WindowInsetsCompat.Type.systemBars())
            controller.systemBarsBehavior =
                WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        } catch (_: Throwable) {
        }
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) {
            hideSystemUI()
        }
    }

    override fun onDestroy() {
        try {
            webViewRef?.destroy()
            webViewRef = null
        } catch (_: Throwable) {
        }
        super.onDestroy()
    }
}
