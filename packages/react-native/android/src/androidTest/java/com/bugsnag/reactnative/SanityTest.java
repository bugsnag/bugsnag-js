package com.bugsnag.reactnative;

import static org.junit.Assert.assertEquals;

import androidx.test.InstrumentationRegistry;

import com.facebook.react.bridge.ReactApplicationContext;

import org.junit.Test;

public class SanityTest {

    @Test
    public void testFoo() {
        ReactApplicationContext ctx
            = new ReactApplicationContext(InstrumentationRegistry.getContext());
        assertEquals("BugsnagReactNative", new BugsnagReactNative(ctx).getName());
    }

}
