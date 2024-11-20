---
title: "[HackerRank] Java Priority Queue"
excerpt: "Java Priority Queue"

categories:
  - HackerRank
tags:
  - [algorithms]

toc: true
toc_sticky: true

date: 2022-07-03
last_modified_at: 2022-07-03
---

<https://www.hackerrank.com/challenges/java-priority-queue/problem?isFullScreen=true>

<br>

## Solution

```java
import java.io.*;
import java.util.*;

class Student {
    private int token;
    private String name;
    private double cgpa;

    public Student(int token, String name, double cgpa) {
        this.token = token;
        this.name = name;
        this.cgpa = cgpa;
    }

    public int getToken() {
        return token;
    }

    public String getName() {
        return name;
    }

    public double getCgpa() {
        return cgpa;
    }
}

class Priorities {
    public List<Student> getStudents(List<String> events) {
        PriorityQueue<Student> studentPriorityQueue = new PriorityQueue<>(Comparator.comparing(Student::getCgpa).reversed()
                .thenComparing(Student::getName).thenComparing(Student::getToken));
        List<Student> students = new ArrayList<>();

        for (String e : events) {
            try (Scanner sc = new Scanner(e)) {
                String event = sc.next();

                if (event.equals("ENTER")) {
                    String name = sc.next();
                    float cgpa = sc.nextFloat();
                    int token = sc.nextInt();

                    Student student = new Student(token, name, cgpa);
                    studentPriorityQueue.add(student);
                } else if (event.equals("SERVED")) {
                    Student first = studentPriorityQueue.poll();
                }
            }
        }

        Student first = studentPriorityQueue.poll();
        if (first != null) {
            while (first != null) {
                students.add(first);
                first = studentPriorityQueue.poll();
            }
        }
        return students;
    }
}

public class Solution {
    private final static Scanner sc = new Scanner(System.in);
    private final static Priorities priorities = new Priorities();

    public static void main(String[] args) {
        int totalEvents = Integer.parseInt(sc.nextLine());
        List<String> events = new ArrayList<>();

        while (totalEvents-- != 0) {
            String event = sc.nextLine();
            events.add(event);
        }

        List<Student> students = priorities.getStudents(events);
        if (students.isEmpty()) {
            System.out.println("EMPTY");
        } else {
            for (Student st : students) {
                System.out.println(st.getName());
            }
        }
    }
}
```