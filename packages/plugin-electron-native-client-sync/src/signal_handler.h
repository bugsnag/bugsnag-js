#pragma once

void becs_signal_install(void (*func)(int));

void becs_signal_uninstall(void);

void becs_signal_raise(int signal);
