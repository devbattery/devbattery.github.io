---
title: "[HackerRank] Java Sort"
excerpt: "Java Sort"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-06-21
last_modified_at: 2022-06-21
---

<https://www.hackerrank.com/challenges/java-sort/problem?isFullScreen=true>

<br>

## Solution

```java
import java.io.*;
import java.util.*;

class Student {
    private int id;
    private String firstName;
    private double cgpa;

    public Student(int id, String firstName, double cgpa) {
        this.id = id;
        this.firstName = firstName;
        this.cgpa = cgpa;
    }

    public int getId() {
        return id;
    }

    public String getFirstName() {
        return firstName;
    }

    public double getCgpa() {
        return cgpa;
    }
}

public class Solution {

    public static void main(String[] args) {
        try (Scanner scanner = new Scanner(System.in)) {
            int testCases = Integer.parseInt(scanner.nextLine());

            List<Student> studentList = new ArrayList<>();

            while (testCases > 0) {
                int id = scanner.nextInt();
                String firstName = scanner.next();
                double cgpa = scanner.nextDouble();

                Student student = new Student(id, firstName, cgpa);
                studentList.add(student);

                testCases--;
            }

            studentList.sort(Comparator.comparing(Student::getCgpa).reversed()
                    .thenComparing(Student::getFirstName).thenComparing(Student::getId));

            for (Student student : studentList) {
                System.out.println(student.getFirstName());
            }
        }
    }
}
```