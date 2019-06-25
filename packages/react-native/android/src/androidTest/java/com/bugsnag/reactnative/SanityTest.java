package com.bugsnag.reactnative;

import static org.junit.Assert.assertEquals;

import com.bugsnag.reactnative.BugsnagReactNative;

import android.content.Context;
import android.support.test.InstrumentationRegistry;

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
