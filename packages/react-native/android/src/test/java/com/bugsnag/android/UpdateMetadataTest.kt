package com.bugsnag.android

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableMap
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.Mock
import org.mockito.Mockito.`when`
import org.mockito.Mockito.times
import org.mockito.Mockito.verify
import org.mockito.junit.MockitoJUnitRunner

@RunWith(MockitoJUnitRunner::class)
class UpdateMetadataTest {

    @Mock
    lateinit var ctx: ReactApplicationContext

    @Mock
    lateinit var client: Client

    @Mock
    lateinit var map: ReadableMap

    private lateinit var brn: BugsnagReactNative

    @Before
    fun setUp() {
        brn = BugsnagReactNative(ctx)
        brn.client = client
    }

    @Test
    fun nullMetadataRemovesSection() {
        brn.updateMetadata("foo", null)
        verify(client, times(1)).clearMetadata("foo")
    }

    @Test
    fun metadataAddSection() {
        val data: HashMap<String, Any?> = hashMapOf(
            "customFoo" to "Flobber",
            "isJs" to true,
            "naughtyValue" to null
        )
        `when`(map.toHashMap()).thenReturn(data)

        brn.updateMetadata("foo", map)
        verify(client, times(1)).addMetadata("foo", data)
    }
}
