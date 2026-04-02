package com.fooddelivery.orderservice.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String ORDER_EXCHANGE = "order.events";

    // 死信队列配置：消费失败的消息会被路由到这里，避免消息丢失
    public static final String ORDER_DLX = "order.events.dlx";
    public static final String ORDER_DLQ = "order.events.dlq";

    @Bean
    public TopicExchange orderExchange() {
        return new TopicExchange(ORDER_EXCHANGE);
    }

    // 死信交换机
    @Bean
    public TopicExchange orderDeadLetterExchange() {
        return new TopicExchange(ORDER_DLX);
    }

    // 死信队列：存放消费失败超过重试次数的消息，可人工排查
    @Bean
    public Queue orderDeadLetterQueue() {
        return QueueBuilder.durable(ORDER_DLQ).build();
    }

    // 死信队列绑定到死信交换机
    @Bean
    public Binding deadLetterBinding() {
        return BindingBuilder.bind(orderDeadLetterQueue())
                .to(orderDeadLetterExchange())
                .with("#"); // 接收所有死信
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jsonMessageConverter());
        return template;
    }
}
