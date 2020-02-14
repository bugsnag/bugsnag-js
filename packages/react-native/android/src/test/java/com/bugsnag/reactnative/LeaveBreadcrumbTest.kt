package com.bugsnag.reactnative

import com.bugsnag.android.BreadcrumbType
import com.bugsnag.android.Client
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableMap
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.ArgumentMatchers.eq
import org.mockito.Mock
import org.mockito.Mockito.`when`
import org.mockito.Mockito.times
import org.mockito.Mockito.verify
import org.mockito.junit.MockitoJUnitRunner

@RunWith(MockitoJUnitRunner::class)
class LeaveBreadcrumbTest {

    @Mock
    lateinit var ctx: ReactApplicationContext

    @Mock
    lateinit var client: Client

    @Mock
    lateinit var crumbMap: ReadableMap

    @Mock
    lateinit var metadataMap: ReadableMap

    private lateinit var brn: BugsnagReactNative

    @Before
    fun setUp() {
        brn = BugsnagReactNative(ctx)
        brn.client = client
    }

    @Test
    fun leaveBreadcrumb() {
        // setup breadcrumb data
        `when`(crumbMap.getString("message")).thenReturn("JS: invoked API")
        `when`(crumbMap.getString("type")).thenReturn("request")
        `when`(crumbMap.getMap("metadata")).thenReturn(metadataMap)

        // setup metadata
        val metadata: HashMap<String, Any?> = hashMapOf(
            "customFoo" to "Flobber",
            "isJs" to true,
            "naughtyValue" to null
        )
        `when`(metadataMap.toHashMap()).thenReturn(metadata)

        // leave a breadcrumb and verify its structure
        brn.leaveBreadcrumb(crumbMap)

        verify(client, times(1)).leaveBreadcrumb(
            eq("JS: invoked API"),
            eq(BreadcrumbType.REQUEST),
            eq(metadata)
        )
    }

    @Test
    fun leaveBreadcrumbNoMetadata() {
        // leave a breadcrumb and verify its structure
        `when`(crumbMap.getString("message")).thenReturn("JS: invoked API")
        `when`(crumbMap.getString("type")).thenReturn("request")
        `when`(crumbMap.getMap("metadata")).thenReturn(null)
        brn.leaveBreadcrumb(crumbMap)

        verify(client, times(1)).leaveBreadcrumb(
            eq("JS: invoked API"),
            eq(BreadcrumbType.REQUEST),
            eq(emptyMap())
        )
    }
}
