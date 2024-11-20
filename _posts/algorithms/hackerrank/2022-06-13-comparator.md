---
title: "[HackerRank] Java Comparator"
excerpt: "Java Comparator"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-06-13
last_modified_at: 2022-06-13
---

<https://www.hackerrank.com/challenges/java-comparator/problem?isFullScreen=true>

<br>

## Solution

```java
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.Arrays;
import java.util.Comparator;
import java.util.Scanner;

class Player {
    String name;
    int score;

    public Player(String name, int score) {
        this.name = name;
        this.score = score;
    }
}

class Solution {
    public static void main(String[] args) {
        try (Scanner scanner = new Scanner(System.in)) {
            int n = scanner.nextInt();
            Player[] player = new Player[n];

            for (int i = 0; i < n; i++) {
                player[i] = new Player(scanner.next(), scanner.nextInt());
            }

            Arrays.sort(player, new Comparator<Player>() {
                @Override
                public int compare(Player p1, Player p2) {
                    if (p1.score == p2.score) {
                        return p1.name.compareTo(p2.name);
                    } else {
                        return p2.score - p1.score; // descending
                    }
                }
            });

            for (Player p : player) {
                System.out.println(p.name + " " + p.score);
            }
        }
    }
}
```