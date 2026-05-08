BEGIN {
    math = 0
}

/^```latex/ { math = 1; next }

/^```/ { 
    if (math == 1) {
        math = 0; 
        next;
    }
}

{ print; next }
