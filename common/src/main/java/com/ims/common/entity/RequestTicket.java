package com.ims.common.entity;

import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Table(name = "request_ticket")
public class RequestTicket {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private int id;

    private UserEntity from;
    private UserEntity to;

    private String content;
}
