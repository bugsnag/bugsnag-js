#pragma once

void becsp_signal_install(void (*func)(int));

void becsp_signal_uninstall(void);

void becsp_signal_raise(int signal);
