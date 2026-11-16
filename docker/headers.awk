# Translate a Cloudflare Pages _headers file into static-web-server
# [[advanced.headers]] tables. A Pages splat (*) also matches across "/",
# so it becomes the glob "**".
#   awk -f docker/headers.awk static/_headers >> docker/sws.toml

/^[[:space:]]*(#|$)/ { next }

/^\// {
	source = $0
	sub(/[[:space:]]+$/, "", source)
	gsub(/\*+/, "**", source)
	printf "\n[[advanced.headers]]\nsource = \"%s\"\n[advanced.headers.headers]\n", source
	next
}

{
	line = $0
	sub(/^[[:space:]]+/, "", line)
	i = index(line, ":")
	if (i == 0) {
		print "headers.awk: no header on line " NR ": " $0 > "/dev/stderr"
		exit 1
	}
	name = substr(line, 1, i - 1)
	value = substr(line, i + 1)
	sub(/^[[:space:]]+/, "", value)
	sub(/[[:space:]]+$/, "", value)
	gsub(/\\/, "\\\\", value)
	gsub(/"/, "\\\"", value)
	printf "%s = \"%s\"\n", name, value
}
