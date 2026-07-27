/*
=========================================================
 Caro AI Engine — Native C Reference Implementation
 Minimax + Alpha-Beta Pruning + Threat Evaluation
=========================================================
*/

#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>

#define BOARD_SIZE 15
#define TOTAL_CELLS 225

static unsigned char board[TOTAL_CELLS];
static const int DIRS_R[4] = {0, 1, 1, 1};
static const int DIRS_C[4] = {1, 0, 1, -1};

void resetBoard(void) {
    for (int i = 0; i < TOTAL_CELLS; i++) board[i] = 0;
}

void setCell(int r, int c, int val) {
    if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
        board[r * BOARD_SIZE + c] = (unsigned char)val;
    }
}

static bool checkWinAt(int r, int c, unsigned char player) {
    for (int d = 0; d < 4; d++) {
        int dr = DIRS_R[d], dc = DIRS_C[d];
        int count = 1;
        int step = 1;
        while (1) {
            int nr = r + dr * step, nc = c + dc * step;
            if (nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE) break;
            if (board[nr * BOARD_SIZE + nc] == player) { count++; step++; } else break;
        }
        step = 1;
        while (1) {
            int nr = r - dr * step, nc = c - dc * step;
            if (nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE) break;
            if (board[nr * BOARD_SIZE + nc] == player) { count++; step++; } else break;
        }
        if (count >= 5) return true;
    }
    return false;
}

static int evaluateLine(int r, int c, int dr, int dc, unsigned char player) {
    int count = 1, openEnds = 0, i = 1;
    while (1) {
        int nr = r + dr * i, nc = c + dc * i;
        if (nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE) break;
        unsigned char val = board[nr * BOARD_SIZE + nc];
        if (val == player) { count++; i++; }
        else { if (val == 0) openEnds++; break; }
    }
    i = 1;
    while (1) {
        int nr = r - dr * i, nc = c - dc * i;
        if (nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE) break;
        unsigned char val = board[nr * BOARD_SIZE + nc];
        if (val == player) { count++; i++; }
        else { if (val == 0) openEnds++; break; }
    }

    if (count >= 5) return 1000000;
    if (count == 4) return openEnds == 2 ? 100000 : (openEnds == 1 ? 10000 : 0);
    if (count == 3) return openEnds == 2 ? 5000 : (openEnds == 1 ? 1000 : 0);
    if (count == 2) return openEnds == 2 ? 500 : 0;
    return 0;
}

int evaluateBoard(void) {
    int scoreAI = 0, scoreHuman = 0;
    for (int r = 0; r < BOARD_SIZE; r++) {
        for (int c = 0; c < BOARD_SIZE; c++) {
            unsigned char p = board[r * BOARD_SIZE + c];
            if (p == 1) {
                for (int d = 0; d < 4; d++) scoreAI += evaluateLine(r, c, DIRS_R[d], DIRS_C[d], 1);
            } else if (p == 2) {
                for (int d = 0; d < 4; d++) scoreHuman += evaluateLine(r, c, DIRS_R[d], DIRS_C[d], 2);
            }
        }
    }
    return scoreAI - scoreHuman;
}
