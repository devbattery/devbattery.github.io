---
title: "[LeetCode] 1603. Design Parking System (Java)"
excerpt: "Design Parking System"

categories:
  - LeetCode
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-08-13
last_modified_at: 2022-08-13
---

<https://leetcode.com/problems/design-parking-system/submissions/>

<br>

## Solution

```java
class ParkingSystem {
    private final int[] count;

    public ParkingSystem(int big, int medium, int small) {
        this.count = new int[]{big, medium, small};
    }

    public boolean addCar(int carType) {
        return count[carType - 1]-- > 0;
    }
}

class Solution {
    public static void main(String[] args) {
        ParkingSystem obj = new ParkingSystem(1, 1, 0);
        boolean param_1 = obj.addCar(1);
        boolean param_2 = obj.addCar(2);
        boolean param_3 = obj.addCar(3);
        boolean param_4 = obj.addCar(1);

        System.out.println(obj);
        System.out.println(param_1);
        System.out.println(param_2);
        System.out.println(param_3);
        System.out.println(param_4);
    }
}
```