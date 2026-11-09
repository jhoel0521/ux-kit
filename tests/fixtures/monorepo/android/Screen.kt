@Composable
fun Row() {
  Box(Modifier.size(32.dp).clickable { borrar() })
  Text("Hola", fontSize = 14.dp, color = Color(0xFF777777))
  IconButton(onClick = {}) { Icon(Icons.Default.Delete, contentDescription = null) }
  CompositionLocalProvider(LocalMinimumInteractiveComponentSize provides 0.dp) { }
}
