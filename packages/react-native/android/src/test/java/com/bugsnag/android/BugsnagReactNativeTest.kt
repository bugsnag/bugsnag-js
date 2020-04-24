package com.bugsnag.android

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableMap
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
