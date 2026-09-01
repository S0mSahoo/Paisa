package com.example.data.local

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey
import com.example.data.model.PaymentMethod
import com.example.data.model.TransactionCategory
import com.example.data.model.TransactionItem
import com.example.data.model.TransactionType

@Entity(
  tableName = "transactions",
  indices = [
    Index(value = ["timestamp"]),
    Index(value = ["type"]),
    Index(value = ["category"]),
    Index(value = ["recurringRuleId"])
  ]
)
data class TransactionEntity(
  @PrimaryKey(autoGenerate = true)
  val id: Long = 0,
  val title: String,
  val amount: Double,
  val type: String, // TransactionType.name
  val category: String, // TransactionCategory.name
  val timestamp: Long,
  val note: String = "",
  val paymentMethod: String = PaymentMethod.UPI.name,
  val isRecurring: Boolean = false,
  val recurringRuleId: Long? = null,
  val createdAt: Long = System.currentTimeMillis(),
  val updatedAt: Long = System.currentTimeMillis()
) {
  fun toModel(): TransactionItem {
    val parsedType = try {
      TransactionType.valueOf(type)
    } catch (e: Exception) {
      TransactionType.EXPENSE
    }

    val parsedCategory = try {
      TransactionCategory.valueOf(category)
    } catch (e: Exception) {
      TransactionCategory.OTHER_EXPENSE
    }

    val parsedMethod = try {
      PaymentMethod.valueOf(paymentMethod)
    } catch (e: Exception) {
      PaymentMethod.UPI
    }

    return TransactionItem(
      id = id,
      title = title,
      amount = amount,
      type = parsedType,
      category = parsedCategory,
      timestamp = timestamp,
      note = note,
      paymentMethod = parsedMethod,
      isRecurring = isRecurring,
      recurringRuleId = recurringRuleId,
      createdAt = createdAt,
      updatedAt = updatedAt
    )
  }

  companion object {
    fun fromModel(model: TransactionItem): TransactionEntity {
      return TransactionEntity(
        id = model.id,
        title = model.title,
        amount = model.amount,
        type = model.type.name,
        category = model.category.name,
        timestamp = model.timestamp,
        note = model.note,
        paymentMethod = model.paymentMethod.name,
        isRecurring = model.isRecurring,
        recurringRuleId = model.recurringRuleId,
        createdAt = model.createdAt,
        updatedAt = model.updatedAt
      )
    }
  }
}
