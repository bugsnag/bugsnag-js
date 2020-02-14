package com.bugsnag.reactnative

import com.bugsnag.android.Client
import com.facebook.react.bridge.PromiseImpl
import com.facebook.react.bridge.ReactApplicationContext
import org.junit.Assert
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.Mock
import org.mockito.Mockito.times
import org.mockito.Mockito.verify
import org.mockito.junit.MockitoJUnitRunner

@RunWith(MockitoJUnitRunner::class)
class PayloadInfoTest {

    @Mock
    lateinit var ctx: ReactApplicationContext

    @Mock
    lateinit var client: Client

    private lateinit var brn: BugsnagReactNative

    @Before
    fun setUp() {
        brn = BugsnagReactNative(ctx)
        brn.client = client
    }

    @Test
    fun getPayloadInfo() {
        var data: Any? = null
        brn.getPayloadInfo(PromiseImpl({
            data = it.first()
        }, null))

        assertNotNull(data)
    }
}
