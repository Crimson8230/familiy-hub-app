package com.familyhub.app.data.accounts

import androidx.annotation.StringRes
import com.familyhub.app.R

enum class School(val code: String, @StringRes val labelRes: Int) {
    PRIMARY("grundschule", R.string.primary_school),
    MIDDLE("mittelschule", R.string.middle_school);

    companion object {
        fun fromCode(code: String): School? = entries.firstOrNull { it.code == code }
    }
}
