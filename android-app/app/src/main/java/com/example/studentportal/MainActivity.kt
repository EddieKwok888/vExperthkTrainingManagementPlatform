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
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.QrCodeScanner
import androidx.compose.material.icons.filled.School
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
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
                var isUserLoggedIn by remember { mutableStateOf(auth.currentUser != null) }

                if (isUserLoggedIn) {
                    StudentPortalApp(onLogout = {
                        auth.signOut()
                        isUserLoggedIn = false
                    })
                } else {
                    LoginScreen(
                        auth = auth,
                        onLoginSuccess = { isUserLoggedIn = true }
                    )
                }
            }
        }
    }

    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    fun LoginScreen(auth: FirebaseAuth, onLoginSuccess: () -> Unit) {
        var email by remember { mutableStateOf("") }
        var password by remember { mutableStateOf("") }
        var isLoading by remember { mutableStateOf(false) }
        var errorMessage by remember { mutableStateOf("") }

        Column(
            modifier = Modifier.fillMaxSize().padding(32.dp).background(MaterialTheme.colorScheme.background),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(
                imageVector = Icons.Filled.School,
                contentDescription = "Company Logo",
                modifier = Modifier.size(80.dp),
                tint = Color(0xFF1E3A8A)
            )
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                "Student Portal", 
                style = MaterialTheme.typography.headlineLarge, 
                fontWeight = FontWeight.Bold, 
                color = Color(0xFF1E3A8A)
            )
            Text(
                "Student Login", 
                style = MaterialTheme.typography.bodyLarge, 
                color = Color.Gray,
                modifier = Modifier.padding(top = 8.dp)
            )
            Spacer(modifier = Modifier.height(32.dp))

            OutlinedTextField(
                value = email,
                onValueChange = { email = it },
                label = { Text("Email (Username)") },
                modifier = Modifier.fillMaxWidth(),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                singleLine = true
            )
            Spacer(modifier = Modifier.height(16.dp))
            OutlinedTextField(
                value = password,
                onValueChange = { password = it },
                label = { Text("Password") },
                modifier = Modifier.fillMaxWidth(),
                visualTransformation = PasswordVisualTransformation(),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                singleLine = true
            )
            
            Spacer(modifier = Modifier.height(24.dp))
            
            if (errorMessage.isNotEmpty()) {
                Text(
                    text = errorMessage, 
                    color = MaterialTheme.colorScheme.error, 
                    modifier = Modifier.padding(bottom = 16.dp)
                )
            }

            Button(
                onClick = {
                    if (email.isBlank() || password.isBlank()) {
                        errorMessage = "請輸入 Email 和密碼"
                        return@Button
                    }
                    isLoading = true
                    errorMessage = ""
                    auth.signInWithEmailAndPassword(email.trim(), password)
                        .addOnSuccessListener {
                            isLoading = false
                            onLoginSuccess()
                        }
                        .addOnFailureListener { e ->
                            isLoading = false
                            errorMessage = e.localizedMessage ?: "登入失敗"
                        }
                },
                modifier = Modifier.fillMaxWidth().height(50.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF2563EB)),
                enabled = !isLoading
            ) {
                if (isLoading) {
                    CircularProgressIndicator(color = Color.White, modifier = Modifier.size(24.dp))
                } else {
                    Text("Login")
                }
            }
        }
    }

    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    fun StudentPortalApp(onLogout: () -> Unit) {
        var statusMessage by remember { mutableStateOf("歡迎回到 Student Portal") }
        var enrolledCourses by remember { mutableStateOf<List<EnrolledCourseData>>(emptyList()) }
        var isLoading by remember { mutableStateOf(true) }

        LaunchedEffect(Unit) {
            try {
                val user = auth.currentUser

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
                    statusMessage = "無法獲取登入資訊，請重新登入"
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
                    title = {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Filled.School,
                                contentDescription = "Company Logo",
                                modifier = Modifier.size(28.dp),
                                tint = Color(0xFF1E3A8A)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("My Courses")
                        }
                    },
                    actions = {
                        TextButton(onClick = { onLogout() }) {
                            Text("登出", color = Color(0xFF1E40AF), fontWeight = FontWeight.Bold)
                        }
                    },
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
