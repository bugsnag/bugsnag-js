package com.bugsnag.android

import com.facebook.react.bridge.ReactApplicationContext
import org.junit.Assert.assertEquals
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.Mock
import org.mockito.Mockito.times
import org.mockito.Mockito.verify
import org.mockito.junit.MockitoJUnitRunner

@RunWith(MockitoJUnitRunner::class)
class BugsnagReactNativeTest {

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
    fun getName() {
        assertEquals("BugsnagReactNative", brn.name)
    }

    @Test
    fun startSession() {
        brn.startSession()
        verify(client, times(1)).startSession()
    }

    @Test
    fun pauseSession() {
        brn.pauseSession()
        verify(client, times(1)).pauseSession()
    }

    @Test
    fun resumeSession() {
        brn.resumeSession()
        verify(client, times(1)).resumeSession()
    }

    @Test
    fun updateContext() {
        brn.updateContext("Foo")
        verify(client, times(1)).context = "Foo"
    }

    @Test
    fun updateUser() {
        brn.updateUser("123", "joe@example.com", "Joe")
        verify(client, times(1)).setUser("123", "joe@example.com", "Joe")
    }
}
