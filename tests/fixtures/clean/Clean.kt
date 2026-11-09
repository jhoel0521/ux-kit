@Composable
fun Clean(onAdd: () -> Unit) {
  IconButton(onClick = onAdd) {
    Icon(Icons.Default.Add, contentDescription = "Add", modifier = Modifier.size(24.dp))
  }
}
