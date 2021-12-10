package com.bugsnag.android

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableArray
import org.junit.Assert.assertEquals
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.Mock
import org.mockito.Mockito.`when`
import org.mockito.Mockito.any
import org.mockito.Mockito.times
import org.mockito.Mockito.verify
import org.mockito.junit.MockitoJUnitRunner

@RunWith(MockitoJUnitRunner::class)
class BugsnagReactNativeTest {

    @Mock
    lateinit var ctx: ReactApplicationContext

    @Mock
    lateinit var plugin: BugsnagReactNativePlugin

    @Mock
    lateinit var map: ReadableMap

    @Mock
    lateinit var array: ReadableArray

    @Mock
    lateinit var promise: Promise

    private lateinit var brn: BugsnagReactNative

    @Before
    fun setUp() {
        brn = BugsnagReactNative(ctx)
        brn.plugin = plugin
        brn.logger = object: Logger {}
        `when`(map.toHashMap()).thenReturn(HashMap())
    }

    @Test
    fun getName() {
        assertEquals("BugsnagReactNative", brn.name)
    }

    @Test
    fun leaveBreadcrumb() {
        brn.leaveBreadcrumb(map)
        verify(plugin, times(1)).leaveBreadcrumb(any())
    }

    @Test
    fun startSession() {
        brn.startSession()
        verify(plugin, times(1)).startSession()
    }

    @Test
    fun pauseSession() {
        brn.pauseSession()
        verify(plugin, times(1)).pauseSession()
    }

    @Test
    fun resumeSession() {
        brn.resumeSession()
        verify(plugin, times(1)).resumeSession()
    }

    @Test
    fun addFeatureFlag() {
        brn.addFeatureFlag("feature flag", "abc123")
        verify(plugin, times(1)).addFeatureFlag("feature flag", "abc123")
    }

    @Test
    fun addFeatureFlags() {
        `when`(array.size()).thenReturn(1)
        `when`(array.getMap(eq(0))).thenReturn(map)
        `when`(map.getString(eq("name"))).thenReturn("feature flag")
        `when`(map.getString(eq("variant"))).thenReturn("abc123")
        brn.addFeatureFlags(array)
        verify(plugin, times(1)).addFeatureFlag("feature flag", "abc123")
    }

    @Test
    fun clearFeatureFlag() {
        brn.clearFeatureFlag("feature flag")
        verify(plugin, times(1)).clearFeatureFlag("feature flag")
    }

    @Test
    fun clearFeatureFlags() {
        brn.clearFeatureFlags()
        verify(plugin, times(1)).clearFeatureFlags()
    }

    @Test
    fun updateContext() {
        brn.updateContext("Foo")
        verify(plugin, times(1)).updateContext("Foo")
    }

    @Test
    fun updateUser() {
        brn.updateUser("123", "joe@example.com", "Joe")
        verify(plugin, times(1)).updateUser("123", "joe@example.com", "Joe")
    }

    @Test
    fun dispatch() {
        brn.dispatch(map, promise)
        verify(plugin, times(1)).dispatch(any())
    }

    @Test
    fun getPayloadInfo() {
        brn.getPayloadInfo(map, promise)
        verify(plugin, times(1)).getPayloadInfo(false)
    }
}
