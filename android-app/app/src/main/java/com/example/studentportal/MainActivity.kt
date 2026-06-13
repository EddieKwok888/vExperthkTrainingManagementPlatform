package com.example.studentportal

import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.QrCodeScanner
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.ktx.auth
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.ktx.firestore
import com.google.firebase.ktx.Firebase
import com.google.mlkit.vision.codescanner.GmsBarcodeScannerOptions
import com.google.mlkit.vision.codescanner.GmsBarcodeScanning
import kotlinx.coroutines.tasks.await
import java.util.Calendar

data class Registration(val id: String, val courseId: String, val sessionId: String, val status: String)
data class Course(val id: String, val title: String, val courseCode: String)
data class EnrolledCourseData(val registration: Registration, val course: Course?)

class MainActivity : ComponentActivity() {

    private lateinit var auth: FirebaseAuth
    private val db = Firebase.firestore

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        enableEdgeToEdge()
        auth = Firebase.auth

        setContent {
            MaterialTheme {
                StudentPortalApp()
            }
        }
    }

    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    fun StudentPortalApp() {
        var statusMessage by remember { mutableStateOf("歡迎回到 Student Portal") }
        var enrolledCourses by remember { mutableStateOf<List<EnrolledCourseData>>(emptyList()) }
        var isLoading by remember { mutableStateOf(true) }

        LaunchedEffect(Unit) {
            try {
                var user = auth.currentUser
                if (user == null) {
                    statusMessage = "系統登入中..."
                    val result = auth.signInWithEmailAndPassword("student@example.com", "password123").await()
                    user = result.user
                }

                if (user != null) {
                    statusMessage = "讀取課程資料中..."
                    val regSnap = db.collection("registrations")
                        .whereEqualTo("studentId", user.uid)
                        .get().await()

                    val regs = regSnap.documents.map { doc ->
                        Registration(
                            id = doc.id,
                            courseId = doc.getString("courseId") ?: "",
                            sessionId = doc.getString("sessionId") ?: "",
                            status = doc.getString("status") ?: ""
                        )
                    }.filter { it.courseId.isNotEmpty() }

                    if (regs.isNotEmpty()) {
                        val courseIds = regs.map { it.courseId }.distinct()
                        val courseList = mutableListOf<Course>()
                        
                        courseIds.chunked(10).forEach { chunk ->
                            val cSnap = db.collection("courses")
                                .whereIn(com.google.firebase.firestore.FieldPath.documentId(), chunk)
                                .get().await()
                            
                            courseList.addAll(cSnap.documents.map { doc ->
                                Course(
                                    id = doc.id,
                                    title = doc.getString("title") ?: "Unknown",
                                    courseCode = doc.getString("courseCode") ?: ""
                                )
                            })
                        }

                        enrolledCourses = regs.map { reg ->
                            val matchedCourse = courseList.find { it.id == reg.courseId }
                            EnrolledCourseData(reg, matchedCourse)
                        }
                    }
                    statusMessage = "" // 成功後清空訊息
                } else {
                    statusMessage = "無法獲取登入資訊"
                }
            } catch (e: Exception) {
                statusMessage = "發生錯誤: ${e.message}"
            } finally {
                isLoading = false
            }
        }

        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text("My Courses") },
                    colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFFEFF6FF))
                )
            },
            floatingActionButton = {
                ExtendedFloatingActionButton(
                    onClick = {
                        startQRScanner { token ->
                            processAttendanceToken(token) { result ->
                                statusMessage = result
                                Toast.makeText(this@MainActivity, result, Toast.LENGTH_LONG).show()
                            }
                        }
                    },
                    icon = { Icon(Icons.Filled.QrCodeScanner, contentDescription = "Scan") },
                    text = { Text("點名打卡") },
                    containerColor = Color(0xFF2563EB),
                    contentColor = Color.White
                )
            }
        ) { innerPadding ->
            Column(modifier = Modifier.padding(innerPadding).fillMaxSize().background(Color(0xFFF8FAFC))) {
                
                if (statusMessage.isNotEmpty()) {
                    Text(
                        text = statusMessage, 
                        color = Color(0xFF1E40AF),
                        modifier = Modifier.padding(16.dp),
                        fontWeight = FontWeight.Bold
                    )
                }

                if (isLoading) {
                    CircularProgressIndicator(modifier = Modifier.align(Alignment.CenterHorizontally).padding(32.dp))
                } else if (enrolledCourses.isEmpty()) {
                    Text("你目前尚未報名任何課程。", modifier = Modifier.padding(16.dp), color = Color.Gray)
                } else {
                    LazyColumn(contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        items(enrolledCourses) { data ->
                            CourseCard(data)
                        }
                    }
                }
            }
        }
    }

    @Composable
    fun CourseCard(data: EnrolledCourseData) {
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "${data.course?.courseCode} ${data.course?.title}",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF1E293B)
                )
                Spacer(modifier = Modifier.height(8.dp))
                
                val statusColor = if (data.registration.status.equals("verified", true)) Color(0xFF16A34A) else Color(0xFFD97706)
                Text(
                    text = "狀態: ${data.registration.status.uppercase()}",
                    style = MaterialTheme.typography.labelMedium,
                    color = statusColor,
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }

    private fun startQRScanner(onScanned: (String) -> Unit) {
        val options = GmsBarcodeScannerOptions.Builder()
            .setBarcodeFormats(com.google.mlkit.vision.barcode.common.Barcode.FORMAT_QR_CODE)
            .enableAutoZoom()
            .build()

        GmsBarcodeScanning.getClient(this, options).startScan()
            .addOnSuccessListener { barcode -> barcode.rawValue?.let { onScanned(it) } }
            .addOnFailureListener { Toast.makeText(this, "取消掃描", Toast.LENGTH_SHORT).show() }
    }

    private fun processAttendanceToken(token: String, onResult: (String) -> Unit) {
        val user = auth.currentUser ?: return onResult("錯誤：請先登入")
        var targetLessonId = ""

        when {
            token.startsWith("DYN-") -> {
                targetLessonId = token.split("-").getOrNull(1) ?: return
                db.collection("attendance_tokens").document(targetLessonId).get()
                    .addOnSuccessListener { doc ->
                        if (!doc.exists()) return@addOnSuccessListener onResult("錯誤：Token 找不到")
                        val isExpired = System.currentTimeMillis() > (doc.getLong("expiresAt") ?: 0L) + 60000
                        if (doc.getString("token") != token && isExpired) {
                            return@addOnSuccessListener onResult("錯誤：Token 已過期，請掃描最新畫面")
                        }
                        executeCheckIn(targetLessonId, user.uid, onResult)
                    }
                return
            }
            token.startsWith("STAT-") -> {
                targetLessonId = token.split("-").getOrNull(1) ?: return
                executeCheckIn(targetLessonId, user.uid, onResult)
                return
            }
            else -> onResult("錯誤：無法識別的 Token")
        }
    }

    private fun executeCheckIn(targetLessonId: String, userId: String, onResult: (String) -> Unit) {
        val splitParts = targetLessonId.split("_")
        val actualLessonId = splitParts[0]
        val forcedPeriod = splitParts.getOrNull(1)

        val isAM = forcedPeriod?.equals("AM") ?: (Calendar.getInstance().get(Calendar.HOUR_OF_DAY) < 13)
        val attRef = db.collection("attendance").document("${actualLessonId}_${userId}")

        val updates = hashMapOf<String, Any>("updatedAt" to FieldValue.serverTimestamp())
        if (isAM) updates["present_am"] = true else updates["present_pm"] = true

        attRef.get().addOnSuccessListener { doc ->
            if (doc.exists()) {
                attRef.update(updates).addOnSuccessListener { onResult("簽到成功！(${if (isAM) "上午" else "下午"}更新)") }
            } else {
                attRef.set(hashMapOf(
                    "lessonId" to actualLessonId, "studentId" to userId,
                    "present_am" to isAM, "present_pm" to !isAM,
                    "createdAt" to FieldValue.serverTimestamp(), "updatedAt" to FieldValue.serverTimestamp()
                )).addOnSuccessListener { onResult("簽到成功！(建立新紀錄)") }
            }
        }
    }
}
